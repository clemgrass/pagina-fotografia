// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

// Lee `_headers` de Cloudflare y calcula las cabeceras que recibe cada ruta,
// para que el test verifique la CSP y el resto (ADR 0007 y 0016).
// Formato: developers.cloudflare.com/workers/static-assets/headers

export const HEADERS_FILE = 'public/_headers';

// Límites del archivo en Cloudflare (ADR 0001).
export const MAX_RULES = 100;
export const MAX_LINE_LENGTH = 2000;

export interface HeaderRule {
  /** Ruta con a lo más un splat `*` y placeholders `:nombre`. */
  pattern: string;
  /** Cabeceras que quita (`! Nombre`) de las reglas anteriores. */
  detach: string[];
  set: { name: string; value: string }[];
}

const HEADER_NAME = /^[A-Za-z0-9-]+$/;
const PLACEHOLDER = /^:[A-Za-z]\w*$/;

const isIndented = (line: string) => /^\s/.test(line);
const isSkipped = (line: string) => {
  const trimmed = line.trim();
  return trimmed === '' || trimmed.startsWith('#');
};

/** Reglas del archivo, en orden. Lanza un error con la línea si algo no calza. */
export function parseHeaders(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  text.split('\n').forEach((line, index) => {
    if (isSkipped(line)) return;
    const fail = (reason: string): never => {
      throw new Error(`${HEADERS_FILE}, línea ${index + 1}: ${reason}`);
    };
    const trimmed = line.trim();

    if (!isIndented(line)) {
      if (!trimmed.startsWith('/')) fail('el patrón tiene que empezar con "/"');
      if ((trimmed.match(/\*/g) ?? []).length > 1) {
        fail('el patrón tiene más de un splat "*"');
      }
      rules.push({ pattern: trimmed, detach: [], set: [] });
      return;
    }

    const rule = rules.at(-1) ?? fail('cabecera antes del primer patrón');
    if (trimmed.startsWith('! ')) {
      rule.detach.push(trimmed.slice(2).trim());
      return;
    }
    const colon = trimmed.indexOf(':');
    const name = trimmed.slice(0, Math.max(colon, 0)).trim();
    const value = trimmed.slice(colon + 1).trim();
    if (colon === -1 || !HEADER_NAME.test(name) || value === '') {
      fail('se esperaba "Nombre: valor" o "! Nombre"');
    }
    rule.set.push({ name, value });
  });
  return rules;
}

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// El splat toma cualquier cosa; un placeholder, un segmento sin "/".
function patternRegExp(pattern: string): RegExp {
  const source = pattern
    .split(/(\*|:[A-Za-z]\w*)/)
    .map((part, i) => {
      if (i % 2 === 0) return escapeRegExp(part);
      return PLACEHOLDER.test(part) ? '[^/]+' : '.*';
    })
    .join('');
  return new RegExp(`^${source}$`);
}

/**
 * Cabeceras que Cloudflare entrega para `path`, con los nombres en minúsculas.
 * Aplica las reglas en orden, une con coma los valores repetidos y respeta `!`.
 */
export function headersFor(
  rules: readonly HeaderRule[],
  path: string,
): Record<string, string> {
  const headers = new Map<string, string[]>();
  for (const rule of rules) {
    if (!patternRegExp(rule.pattern).test(path)) continue;
    for (const name of rule.detach) headers.delete(name.toLowerCase());
    for (const { name, value } of rule.set) {
      const key = name.toLowerCase();
      headers.set(key, [...(headers.get(key) ?? []), value]);
    }
  }
  return Object.fromEntries(
    [...headers].map(([name, values]) => [name, values.join(', ')]),
  );
}

/** Problemas con los límites de Cloudflare. Vacío si cabe. */
export function limitProblems(text: string): string[] {
  const lines = text.split('\n');
  const problems: string[] = [];
  const rules = lines.filter((l) => !isSkipped(l) && !isIndented(l)).length;
  if (rules > MAX_RULES) {
    problems.push(`tiene ${rules} reglas; el máximo es ${MAX_RULES}`);
  }
  lines.forEach((line, index) => {
    if (line.length > MAX_LINE_LENGTH) {
      problems.push(
        `línea ${index + 1}: ${line.length} caracteres; ` +
          `el máximo es ${MAX_LINE_LENGTH}`,
      );
    }
  });
  return problems;
}

const splitDirectives = (policy: string) =>
  policy
    .split(';')
    .map((directive) => directive.trim().split(/\s+/))
    .filter(([name]) => name !== '')
    .map(([name = '', ...sources]) => ({ name: name.toLowerCase(), sources }));

/**
 * Directivas de una CSP con sus fuentes. Si una se repite, vale la primera,
 * como en el navegador.
 */
export function cspDirectives(policy: string): Record<string, string[]> {
  const directives: Record<string, string[]> = {};
  for (const { name, sources } of splitDirectives(policy)) {
    directives[name] ??= sources;
  }
  return directives;
}

// Un esquema completo (`https:`, `data:`) permite cualquier URL con él.
const SCHEME_SOURCE = /^[a-z][a-z0-9+.-]*:$/i;

/** Fuentes que abren la CSP, en español. Vacío si es estricta. */
export function cspProblems(policy: string): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const { name, sources } of splitDirectives(policy)) {
    if (seen.has(name)) problems.push(`la directiva ${name} está repetida`);
    seen.add(name);
    for (const source of sources) {
      if (/unsafe-/i.test(source)) {
        problems.push(`${name} permite ${source}`);
      } else if (source.includes('*')) {
        problems.push(`${name} permite el comodín ${source}`);
      } else if (SCHEME_SOURCE.test(source)) {
        problems.push(`${name} permite todo el esquema ${source}`);
      }
    }
  }
  return problems;
}
