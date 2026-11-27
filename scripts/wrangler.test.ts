// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

import {
  WRANGLER_FILE,
  parseWranglerConfig,
  wranglerProblems,
} from './wrangler.ts';

const VALID = {
  name: 'sitio',
  compatibility_date: '2026-01-01',
  workers_dev: true,
  preview_urls: false,
  assets: { directory: './dist', not_found_handling: '404-page' },
};

describe('parseWranglerConfig', () => {
  test('lee JSONC con comentarios y coma final', () => {
    const config = parseWranglerConfig(
      '// Comentario\n{\n  "name": "sitio", /* otro */\n}\n',
    );
    assert.deepEqual(config, { name: 'sitio' });
  });

  test('rechaza un JSONC mal formado', () => {
    assert.throws(() => parseWranglerConfig('{ "name": }'), /wrangler\.jsonc/);
  });
});

describe('wranglerProblems', () => {
  test('acepta un Worker solo con assets en workers.dev', () => {
    assert.deepEqual(wranglerProblems(VALID), []);
  });

  test('rechaza un script en "main": el Worker es solo assets', () => {
    assert.deepEqual(wranglerProblems({ ...VALID, main: 'src/index.ts' }), [
      'clave no permitida: "main"',
    ]);
  });

  test('rechaza "account_id": la cuenta va en CLOUDFLARE_ACCOUNT_ID', () => {
    assert.deepEqual(wranglerProblems({ ...VALID, account_id: '0123' }), [
      'clave no permitida: "account_id"',
    ]);
  });

  test('exige las Version URLs apagadas aunque el default las prenda', () => {
    const { preview_urls: _, ...withoutPreviewUrls } = VALID;
    assert.deepEqual(wranglerProblems(withoutPreviewUrls), [
      '"preview_urls" debe ser false',
    ]);
  });

  test('exige los assets en ./dist con la página 404 propia', () => {
    assert.deepEqual(
      wranglerProblems({
        ...VALID,
        assets: {
          directory: 'dist/',
          not_found_handling: 'single-page-application',
        },
      }),
      [
        '"assets.directory" debe ser "./dist"',
        '"assets.not_found_handling" debe ser "404-page"',
      ],
    );
  });

  test('rechaza claves de más dentro de "assets"', () => {
    assert.deepEqual(
      wranglerProblems({
        ...VALID,
        assets: { ...VALID.assets, run_worker_first: true },
      }),
      ['clave no permitida: "assets.run_worker_first"'],
    );
  });

  test('rechaza una configuración que no es un objeto', () => {
    assert.deepEqual(wranglerProblems([]), [
      'la configuración debe ser un objeto',
    ]);
  });
});

describe(WRANGLER_FILE, () => {
  test('cumple las reglas del Worker solo con assets', () => {
    const config = parseWranglerConfig(readFileSync(WRANGLER_FILE, 'utf8'));
    assert.deepEqual(wranglerProblems(config), []);
  });
});
