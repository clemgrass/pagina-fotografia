// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

// Smoke del sitio publicado (ADR 0013): pide unas pocas rutas, una vez y sin
// reintentos, y compara lo que responde Cloudflare con lo que declara
// `_headers`. Si algo falla, el job de deploy hace rollback.
// Uso: node scripts/smoke.ts https://foto.clemgrass.workers.dev

import { readFileSync } from 'node:fs';

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
  | { path: string; status: number; headers: Record<string, string> }
  | { path: string; error: string };

// Tipo MIME sin parámetros: `charset` no cambia cómo lo lee el navegador,
// pero un valor unido con coma sí.
const mimeEssence = (value: string) =>
  (value.split(';')[0] ?? '').trim().toLowerCase();

/** Problemas de las respuestas, en español y en el orden de las rutas. */
export function smokeProblems(
  observed: readonly Observed[],
  rules: readonly HeaderRule[],
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
    if (type !== undefined && mimeEssence(actualType) !== mimeEssence(type)) {
      fail(`Content-Type "${actualType}", se esperaba "${type}"`);
    }
  }
  return problems;
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
        await response.body?.cancel();
        return {
          path,
          status: response.status,
          headers: Object.fromEntries(response.headers),
        };
      } catch (error) {
        return { path, error: (error as Error).message };
      }
    }),
  );
}

if (import.meta.main) {
  const baseUrl = process.argv[2];
  if (!baseUrl) {
    console.error('Uso: node scripts/smoke.ts <url del sitio>');
    process.exit(1);
  }
  const rules = parseHeaders(readFileSync(HEADERS_FILE, 'utf8'));
  const problems = smokeProblems(await observe(baseUrl, SMOKE_PATHS), rules);
  if (problems.length > 0) {
    console.error(`Smoke falló en ${baseUrl}:`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }
  console.log(`Smoke OK en ${baseUrl}: ${SMOKE_PATHS.join(', ')}`);
}
