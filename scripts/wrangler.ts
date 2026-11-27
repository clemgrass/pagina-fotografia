// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

// Reglas de wrangler.jsonc (ADR 0001 y 0017). Las claves van en una lista
// cerrada: una clave nueva (`main`, `routes`, `account_id`...) cambia lo que
// se despliega o lo que el token necesita, así que pasa por este test.

import ts from 'typescript';

export const WRANGLER_FILE = 'wrangler.jsonc';

const ALLOWED_KEYS = [
  '$schema',
  'name',
  'compatibility_date',
  'workers_dev',
  'preview_urls',
  'assets',
];
const ALLOWED_ASSETS_KEYS = ['directory', 'not_found_handling'];

/** Lee JSONC (comentarios y comas finales) con el parser de TypeScript. */
export function parseWranglerConfig(text: string): unknown {
  const { config, error } = ts.parseConfigFileTextToJson(WRANGLER_FILE, text);
  if (error) {
    const message = ts.flattenDiagnosticMessageText(error.messageText, '\n');
    throw new Error(`${WRANGLER_FILE}: ${message}`);
  }
  return config;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extraKeys(
  object: Record<string, unknown>,
  allowed: string[],
  prefix = '',
): string[] {
  return Object.keys(object)
    .filter((key) => !allowed.includes(key))
    .map((key) => `clave no permitida: "${prefix}${key}"`);
}

/** Lista lo que no cumple un Worker solo con assets en workers.dev. */
export function wranglerProblems(config: unknown): string[] {
  if (!isObject(config)) return ['la configuración debe ser un objeto'];

  const problems = extraKeys(config, ALLOWED_KEYS);
  if (typeof config.name !== 'string' || config.name === '') {
    problems.push('falta "name"');
  }
  if (typeof config.compatibility_date !== 'string') {
    problems.push('falta "compatibility_date"');
  }
  if (config.workers_dev !== true) problems.push('"workers_dev" debe ser true');
  // Sin esto, workers_dev prende las Version URLs, que son públicas.
  if (config.preview_urls !== false) {
    problems.push('"preview_urls" debe ser false');
  }

  const { assets } = config;
  if (!isObject(assets)) {
    problems.push('falta "assets"');
    return problems;
  }
  problems.push(...extraKeys(assets, ALLOWED_ASSETS_KEYS, 'assets.'));
  if (assets.directory !== './dist') {
    problems.push('"assets.directory" debe ser "./dist"');
  }
  if (assets.not_found_handling !== '404-page') {
    problems.push('"assets.not_found_handling" debe ser "404-page"');
  }
  return problems;
}
