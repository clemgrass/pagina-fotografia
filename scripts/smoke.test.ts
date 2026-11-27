// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { parseHeaders } from './headers.ts';
import {
  SMOKE_PATHS,
  SMOKE_USER_AGENT,
  observe,
  smokeProblems,
  type Observed,
} from './smoke.ts';

const CSP = "default-src 'none'; img-src 'self'";
const RULES_TYPE = 'application/speculationrules+json';
const rules = parseHeaders(
  [
    '/*',
    `  Content-Security-Policy: ${CSP}`,
    '/speculation-rules.json',
    `  Content-Type: ${RULES_TYPE}`,
  ].join('\n'),
);

/** Respuestas sanas de las tres rutas; cada test cambia lo que prueba. */
function healthy(): Observed[] {
  return [
    {
      path: '/',
      status: 200,
      headers: {
        'content-security-policy': CSP,
        'content-type': 'text/html',
      },
    },
    {
      path: '/en/',
      status: 200,
      headers: {
        'content-security-policy': CSP,
        'content-type': 'text/html',
      },
    },
    {
      path: '/speculation-rules.json',
      status: 200,
      headers: { 'content-security-policy': CSP, 'content-type': RULES_TYPE },
    },
  ];
}

function withHeader(path: string, name: string, value: string | undefined) {
  return healthy().map((entry) => {
    if (entry.path !== path || !('headers' in entry)) return entry;
    const headers = { ...entry.headers };
    if (value === undefined) delete headers[name];
    else headers[name] = value;
    return { ...entry, headers };
  });
}

describe('smokeProblems', () => {
  test('no reporta nada si todo responde 200 con la CSP de _headers', () => {
    assert.deepEqual(smokeProblems(healthy(), rules), []);
  });

  test('reporta un estado distinto de 200, incluido un 3xx', () => {
    const observed = healthy().map((entry) =>
      entry.path === '/en/'
        ? { ...entry, status: 404 }
        : entry.path === '/'
          ? { ...entry, status: 301 }
          : entry,
    );
    const problems = smokeProblems(observed, rules);
    assert.equal(problems.length, 2);
    assert.match(problems[0] ?? '', /^\/: .*301/);
    assert.match(problems[1] ?? '', /^\/en\/: .*404/);
  });

  test('reporta una CSP distinta o ausente', () => {
    const other = withHeader(
      '/',
      'content-security-policy',
      "default-src 'self'",
    );
    assert.match(smokeProblems(other, rules).join('\n'), /^\/: .*CSP/);

    const missing = withHeader('/en/', 'content-security-policy', undefined);
    assert.match(smokeProblems(missing, rules).join('\n'), /^\/en\/: .*CSP/);
  });

  test('acepta application/speculationrules+json con parámetros', () => {
    const observed = withHeader(
      '/speculation-rules.json',
      'content-type',
      `${RULES_TYPE}; charset=utf-8`,
    );
    assert.deepEqual(smokeProblems(observed, rules), []);
  });

  test('rechaza un Content-Type unido con coma', () => {
    const observed = withHeader(
      '/speculation-rules.json',
      'content-type',
      `application/json, ${RULES_TYPE}`,
    );
    assert.match(
      smokeProblems(observed, rules).join('\n'),
      /^\/speculation-rules\.json: .*Content-Type/,
    );
  });

  test('reporta una ruta con error de red', () => {
    const observed: Observed[] = [
      ...healthy().slice(1),
      { path: '/', error: 'tiempo agotado' },
    ];
    assert.deepEqual(smokeProblems(observed, rules), [
      '/: no respondió (tiempo agotado)',
    ]);
  });
});

describe('observe', () => {
  type Call = { url: string; init: RequestInit | undefined };

  /** fetch falso que responde 200 y anota cada llamada. */
  function fakeFetch(calls: Call[]): typeof fetch {
    return async (input, init) => {
      calls.push({ url: String(input), init });
      return new Response('ok', {
        status: 200,
        headers: { 'Content-Security-Policy': CSP },
      });
    };
  }

  test('pide cada ruta con el User-Agent propio y redirect manual', async () => {
    const calls: Call[] = [];
    const observed = await observe(
      'https://foto.example.workers.dev',
      SMOKE_PATHS,
      fakeFetch(calls),
    );

    assert.deepEqual(
      calls.map(({ url }) => url),
      SMOKE_PATHS.map((path) => `https://foto.example.workers.dev${path}`),
    );
    for (const { init } of calls) {
      assert.equal(
        new Headers(init?.headers).get('user-agent'),
        SMOKE_USER_AGENT,
      );
      assert.equal(init?.redirect, 'manual');
      assert.ok(init?.signal, 'lleva un timeout');
    }
    assert.deepEqual(observed[0], {
      path: '/',
      status: 200,
      headers: {
        'content-security-policy': CSP,
        'content-type': 'text/plain;charset=UTF-8',
      },
    });
  });

  test('une la URL base con o sin "/" final', async () => {
    const calls: Call[] = [];
    await observe(
      'https://foto.example.workers.dev/',
      ['/en/'],
      fakeFetch(calls),
    );
    assert.deepEqual(
      calls.map(({ url }) => url),
      ['https://foto.example.workers.dev/en/'],
    );
  });

  test('convierte una excepción de fetch en un error de la ruta', async () => {
    const failing: typeof fetch = async () => {
      throw new TypeError('fetch failed');
    };
    const observed = await observe(
      'https://foto.example.workers.dev',
      ['/'],
      failing,
    );
    assert.deepEqual(observed, [{ path: '/', error: 'fetch failed' }]);
  });
});
