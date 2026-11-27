// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { checkHeader, headerOf } from './commit-message.ts';

describe('headerOf', () => {
  test('toma la primera línea del mensaje', () => {
    assert.equal(
      headerOf('feat: agregar galería\n\nCuerpo.\n'),
      'feat: agregar galería',
    );
  });

  test('ignora los comentarios y las líneas vacías que deja git', () => {
    assert.equal(
      headerOf('\n# Comentario de git\nfix: corregir enlace\n'),
      'fix: corregir enlace',
    );
  });

  test('devuelve texto vacío si el mensaje no tiene contenido', () => {
    assert.equal(headerOf('# Solo comentarios\n\n'), '');
  });
});

describe('checkHeader', () => {
  const ok = (header: string) =>
    assert.deepEqual(checkHeader(header), [], header);
  const bad = (header: string) =>
    assert.notDeepEqual(checkHeader(header), [], header);

  test('acepta un tipo con su descripción', () => {
    ok('feat: agregar galería base');
    ok('docs: borrar el plan inicial');
  });

  test('acepta un scope y la marca de cambio incompatible', () => {
    ok('fix(ci): fijar la acción por SHA');
    ok('feat!: cambiar las rutas');
    ok('refactor(scripts)!: renombrar el validador');
  });

  test('acepta un encabezado de 72 caracteres exactos', () => {
    ok(`chore: ${'a'.repeat(72 - 'chore: '.length)}`);
  });

  test('acepta el mensaje que genera git al hacer merge', () => {
    ok("Merge branch 'main' into feat/galeria");
  });

  test('rechaza un tipo que no es de Conventional Commits', () => {
    bad('feature: agregar galería');
    bad('Feat: agregar galería');
  });

  test('rechaza un encabezado sin tipo', () => {
    bad('agregar galería');
    bad('');
  });

  test('rechaza los dos puntos sin espacio o sin descripción', () => {
    bad('feat:agregar galería');
    bad('feat: ');
    bad('feat:');
  });

  test('rechaza un encabezado de más de 72 caracteres', () => {
    bad(`chore: ${'a'.repeat(73 - 'chore: '.length)}`);
  });

  test('rechaza una descripción que termina en punto', () => {
    bad('fix: corregir el enlace.');
  });
});
