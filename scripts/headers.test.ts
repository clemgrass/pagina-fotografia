// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

import {
  HEADERS_FILE,
  MAX_LINE_LENGTH,
  MAX_RULES,
  cspDirectives,
  cspProblems,
  headersFor,
  limitProblems,
  parseHeaders,
} from './headers.ts';

describe('parseHeaders', () => {
  test('lee reglas con sus cabeceras e ignora comentarios y líneas vacías', () => {
    const rules = parseHeaders(
      '# Comentario\n\n/*\n  X-Uno: a\n  X-Dos: b: c\n\n/fotos/*\n  ! X-Uno\n',
    );
    assert.deepEqual(rules, [
      {
        pattern: '/*',
        detach: [],
        set: [
          { name: 'X-Uno', value: 'a' },
          { name: 'X-Dos', value: 'b: c' },
        ],
      },
      { pattern: '/fotos/*', detach: ['X-Uno'], set: [] },
    ]);
  });

  test('rechaza una cabecera antes de la primera regla', () => {
    assert.throws(() => parseHeaders('  X-Uno: a\n'), /línea 1/);
  });

  test('rechaza una cabecera sin ":" o sin valor', () => {
    assert.throws(() => parseHeaders('/*\n  X-Uno\n'), /línea 2/);
    assert.throws(() => parseHeaders('/*\n  X-Uno:\n'), /línea 2/);
  });

  test('rechaza un patrón que no es una ruta', () => {
    assert.throws(() => parseHeaders('fotos/*\n  X-Uno: a\n'), /línea 1/);
  });

  test('rechaza más de un splat en un patrón', () => {
    assert.throws(() => parseHeaders('/*/a/*\n  X-Uno: a\n'), /splat/);
  });
});

describe('headersFor', () => {
  const rules = parseHeaders(
    [
      '/*',
      '  Cache-Control: max-age=0',
      '  X-Lista: a',
      '/fotos/*',
      '  ! Cache-Control',
      '  Cache-Control: immutable',
      '  X-Lista: b',
      '/:lang/',
      '  X-Idioma: si',
    ].join('\n'),
  );

  test('aplica todas las reglas que coinciden, en orden', () => {
    assert.deepEqual(headersFor(rules, '/'), {
      'cache-control': 'max-age=0',
      'x-lista': 'a',
    });
  });

  test('une con coma una cabecera repetida, como Cloudflare', () => {
    assert.equal(headersFor(rules, '/fotos/a.avif')['x-lista'], 'a, b');
  });

  test('"!" quita lo que pusieron las reglas anteriores', () => {
    assert.equal(
      headersFor(rules, '/fotos/a.avif')['cache-control'],
      'immutable',
    );
  });

  test('un placeholder no cruza una "/"', () => {
    assert.equal(headersFor(rules, '/en/')['x-idioma'], 'si');
    assert.equal(headersFor(rules, '/en/fotos/')['x-idioma'], undefined);
  });

  test('un patrón sin splat no coincide con un prefijo', () => {
    const exact = parseHeaders('/a\n  X-Uno: a\n');
    assert.deepEqual(headersFor(exact, '/ab'), {});
  });
});

describe('cspDirectives', () => {
  test('separa las directivas y sus fuentes', () => {
    assert.deepEqual(cspDirectives("default-src 'none'; img-src 'self' ;"), {
      'default-src': ["'none'"],
      'img-src': ["'self'"],
    });
  });
});

describe('cspProblems', () => {
  test('acepta una política estricta', () => {
    assert.deepEqual(
      cspProblems("default-src 'none'; script-src 'self'; base-uri 'none'"),
      [],
    );
  });

  test("rechaza 'unsafe-inline' y las demás fuentes 'unsafe-'", () => {
    for (const source of [
      "'unsafe-inline'",
      "'unsafe-eval'",
      "'unsafe-hashes'",
      "'wasm-unsafe-eval'",
      "'UNSAFE-INLINE'",
    ]) {
      assert.match(
        cspProblems(`script-src 'self' ${source}`).join(),
        /unsafe/i,
        source,
      );
    }
  });

  test('rechaza comodines y esquemas completos', () => {
    for (const source of ['*', 'https://*.example.com', 'data:', 'https:']) {
      assert.notDeepEqual(cspProblems(`img-src ${source}`), [], source);
    }
  });

  test('rechaza una directiva repetida, que el navegador ignora', () => {
    assert.match(
      cspProblems("script-src 'self'; script-src 'self'").join(),
      /repetida/,
    );
  });
});

describe('limitProblems', () => {
  test(`acepta ${MAX_RULES} reglas`, () => {
    const text = Array.from({ length: MAX_RULES }, (_, i) => `/${i}\n  X: a`);
    assert.deepEqual(limitProblems(text.join('\n')), []);
  });

  test(`rechaza más de ${MAX_RULES} reglas`, () => {
    const text = Array.from(
      { length: MAX_RULES + 1 },
      (_, i) => `/${i}\n  X: a`,
    );
    assert.match(limitProblems(text.join('\n')).join(), /reglas/);
  });

  test(`rechaza una línea de más de ${MAX_LINE_LENGTH} caracteres`, () => {
    const long = `/*\n  X: ${'a'.repeat(MAX_LINE_LENGTH)}`;
    assert.match(limitProblems(long).join(), /línea 2/);
  });
});

// El archivo real: ADR 0007, ampliada por la ADR 0016.
describe(HEADERS_FILE, () => {
  const text = readFileSync(HEADERS_FILE, 'utf8');
  const rules = parseHeaders(text);

  const CSP = {
    'default-src': ["'none'"],
    'img-src': ["'self'"],
    'style-src': ["'self'"],
    'font-src': ["'self'"],
    'script-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'none'"],
    'require-trusted-types-for': ["'script'"],
  };

  const SITE = {
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy':
      'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    'cross-origin-opener-policy': 'same-origin',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'x-frame-options': 'DENY',
    'speculation-rules': '"/speculation-rules.json"',
  };

  const IMMUTABLE = 'public, max-age=31536000, immutable';
  const REVALIDATE = 'public, max-age=0, must-revalidate';

  test('respeta los límites de Cloudflare', () => {
    assert.deepEqual(limitProblems(text), []);
  });

  test('la CSP tiene exactamente las directivas de las ADR 0007 y 0016', () => {
    const csp = headersFor(rules, '/')['content-security-policy'] ?? '';
    assert.deepEqual(cspDirectives(csp), CSP);
    assert.deepEqual(cspProblems(csp), []);
  });

  for (const path of [
    '/',
    '/en/',
    '/fotos/faro/',
    '/photos/faro-480.0123456789.avif',
    '/_astro/index.abc123.css',
    '/speculation-rules.json',
  ]) {
    test(`${path} lleva la CSP y las cabeceras de todo el sitio`, () => {
      const headers = headersFor(rules, path);
      assert.deepEqual(
        cspDirectives(headers['content-security-policy'] ?? ''),
        CSP,
      );
      for (const [name, value] of Object.entries(SITE)) {
        assert.equal(headers[name], value, name);
      }
    });
  }

  test('el HTML se revalida y no se comparte con otros orígenes', () => {
    for (const path of ['/', '/en/', '/fotos/faro/']) {
      const headers = headersFor(rules, path);
      assert.equal(headers['cache-control'], REVALIDATE, path);
      assert.equal(headers['cross-origin-resource-policy'], 'same-origin');
    }
  });

  test('las fotos son inmutables y se pueden incrustar (CC BY)', () => {
    const headers = headersFor(rules, '/photos/faro-480.0123456789.avif');
    assert.equal(headers['cache-control'], IMMUTABLE);
    assert.equal(headers['cross-origin-resource-policy'], 'cross-origin');
  });

  test('los assets de Astro son inmutables y solo del sitio', () => {
    const headers = headersFor(rules, '/_astro/index.abc123.css');
    assert.equal(headers['cache-control'], IMMUTABLE);
    assert.equal(headers['cross-origin-resource-policy'], 'same-origin');
  });

  test('las reglas de prefetch salen con su tipo y se revalidan', () => {
    const headers = headersFor(rules, '/speculation-rules.json');
    assert.equal(headers['content-type'], 'application/speculationrules+json');
    assert.equal(headers['cache-control'], REVALIDATE);
  });
});
