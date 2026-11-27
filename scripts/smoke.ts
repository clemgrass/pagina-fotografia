// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

// Smoke del sitio publicado (ADR 0013): pide unas pocas rutas, una vez y sin
// reintentos, y compara lo que responde Cloudflare con lo que declara
// `_headers`. Si algo falla, el job de deploy hace rollback.
// Uso: node scripts/smoke.ts https://foto.clemgrass.workers.dev [dist]

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  HEADERS_FILE,
  headersFor,
  parseHeaders,
  type HeaderRule,
} from './headers.ts';

// Pendiente: una página de foto, cuando exista (ADR 0013).
export const SMOKE_PATHS = ['/', '/en/', '/speculation-rules.json'] as const;

// workers.dev bloquea con el error 1010 el User-Agent por defecto de algunas
// librerías (ADR 0001).
export const SMOKE_USER_AGENT =
  'pagina-fotografia-smoke (+https://github.com/clemgrass/pagina-fotografia)';

const TIMEOUT_MS = 10_000;

export type Observed =
  | {
      path: string;
      status: number;
      headers: Record<string, string>;
      body: string;
    }
  | { path: string; error: string };

// Se compara el tipo MIME sin parámetros: `charset` no cambia cómo lo lee el
// navegador. Una coma, en cualquier parte, sí: son dos valores unidos.
const mimeEssence = (value: string) =>
  (value.split(';')[0] ?? '').trim().toLowerCase();
const sameType = (actual: string, expected: string) =>
  !actual.includes(',') && mimeEssence(actual) === mimeEssence(expected);

/**
 * Problemas de las respuestas, en español y en el orden de las rutas. Con
 * `distBodies` (contenido de cada ruta en el dist/ publicado), revisa además
 * que Cloudflare ya sirva la versión nueva.
 */
export function smokeProblems(
  observed: readonly Observed[],
  rules: readonly HeaderRule[],
  distBodies?: Readonly<Record<string, string>>,
): string[] {
  const problems: string[] = [];
  for (const entry of observed) {
    const fail = (reason: string) => problems.push(`${entry.path}: ${reason}`);
    if ('error' in entry) {
      fail(`no respondió (${entry.error})`);
      continue;
    }
    if (entry.status !== 200) fail(`estado ${entry.status}, se esperaba 200`);

    const expected = headersFor(rules, entry.path);
    const csp = expected['content-security-policy'];
    if (csp !== undefined && entry.headers['content-security-policy'] !== csp) {
      fail('la CSP no es la de _headers');
    }
    const type = expected['content-type'];
    const actualType = entry.headers['content-type'] ?? '';
    if (type !== undefined && !sameType(actualType, type)) {
      fail(`Content-Type "${actualType}", se esperaba "${type}"`);
    }
    const distBody = distBodies?.[entry.path];
    if (distBody !== undefined && entry.body !== distBody) {
      fail('el contenido no es el de dist/ (¿sigue la versión anterior?)');
    }
  }
  return problems;
}

/** Archivo de dist/ que sirve `path`, relativo a dist/. */
export function distFile(path: string): string {
  const relative = path.replace(/^\//, '');
  if (relative.split('/').includes('..')) {
    throw new Error(`la ruta ${path} sale de dist/`);
  }
  return relative === '' || relative.endsWith('/')
    ? `${relative}index.html`
    : relative;
}

/** Pide cada ruta una vez; un error de red queda como `error`, no lanza. */
export async function observe(
  baseUrl: string,
  paths: readonly string[],
  fetchFn: typeof fetch = fetch,
): Promise<Observed[]> {
  return Promise.all(
    paths.map(async (path): Promise<Observed> => {
      try {
        const response = await fetchFn(new URL(path, baseUrl).href, {
          headers: { 'User-Agent': SMOKE_USER_AGENT },
          redirect: 'manual',
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        return {
          path,
          status: response.status,
          headers: Object.fromEntries(response.headers),
          body: await response.text(),
        };
      } catch (error) {
        // `fetch failed` solo dice que falló; la causa dice por qué.
        const { message, cause } = error as Error;
        const detail = cause instanceof Error ? `: ${cause.message}` : '';
        return { path, error: `${message}${detail}` };
      }
    }),
  );
}

if (import.meta.main) {
  const [baseUrl, distDir] = process.argv.slice(2);
  if (!baseUrl) {
    console.error('Uso: node scripts/smoke.ts <url del sitio> [carpeta dist]');
    process.exit(1);
  }
  const rules = parseHeaders(readFileSync(HEADERS_FILE, 'utf8'));
  const distBodies =
    distDir === undefined
      ? undefined
      : Object.fromEntries(
          SMOKE_PATHS.map((path) => [
            path,
            readFileSync(join(distDir, distFile(path)), 'utf8'),
          ]),
        );
  const problems = smokeProblems(
    await observe(baseUrl, SMOKE_PATHS),
    rules,
    distBodies,
  );
  if (problems.length > 0) {
    console.error(`Smoke falló en ${baseUrl}:`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }
  console.log(`Smoke OK en ${baseUrl}: ${SMOKE_PATHS.join(', ')}`);
}
