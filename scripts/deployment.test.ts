// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { activeVersionId } from './deployment.ts';

// Forma de `wrangler deployments status --json` (wrangler 4.165.0).
const status = (versions: unknown) =>
  JSON.stringify({
    id: 'deployment-1',
    source: 'wrangler',
    strategy: 'percentage',
    versions,
  });

describe('activeVersionId', () => {
  test('devuelve el ID de la única versión al 100 %', () => {
    const json = status([{ version_id: 'version-a', percentage: 100 }]);
    assert.equal(activeVersionId(json), 'version-a');
  });

  test('ignora espacios y saltos de línea alrededor del JSON', () => {
    const json = `\n  ${status([{ version_id: 'version-a', percentage: 100 }])}\n\n`;
    assert.equal(activeVersionId(json), 'version-a');
  });

  test('falla si hay más de una versión activa (deploy gradual)', () => {
    const json = status([
      { version_id: 'version-a', percentage: 60 },
      { version_id: 'version-b', percentage: 40 },
    ]);
    assert.throws(() => activeVersionId(json), /gradual/);
  });

  test('falla si la única versión no está al 100 %', () => {
    const json = status([{ version_id: 'version-a', percentage: 50 }]);
    assert.throws(() => activeVersionId(json), /gradual/);
  });

  test('falla si el JSON no trae versions o no es JSON', () => {
    assert.throws(() => activeVersionId('{"id": "deployment-1"}'), /versions/);
    assert.throws(() => activeVersionId('Error: no autorizado'), /JSON/);
  });

  test('falla si el ID de la versión está vacío', () => {
    const json = status([{ version_id: '', percentage: 100 }]);
    assert.throws(() => activeVersionId(json), /version_id/);
  });
});
