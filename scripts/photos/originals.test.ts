// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';

import { EXIF_GPS, IPTC, XMP, cleanJpeg, notJpeg } from './jpeg-fixtures.ts';
import { checkOriginal, cleanOriginal } from './originals.ts';

describe('checkOriginal', () => {
  test('acepta un JPEG limpio con nombre en slug', () => {
    assert.deepEqual(checkOriginal('muelle-en-niebla.jpg', cleanJpeg()), []);
  });

  test('acepta un slug de una palabra o con números', () => {
    assert.deepEqual(checkOriginal('faro.jpg', cleanJpeg()), []);
    assert.deepEqual(checkOriginal('ruta-5-sur.jpg', cleanJpeg()), []);
  });

  test('rechaza nombres que no son slug en minúsculas con .jpg', () => {
    for (const name of [
      '000031 (2).jpg',
      'Faro.jpg',
      'faro.JPG',
      'faro.jpeg',
      'muelle--niebla.jpg',
      'árbol.jpg',
    ]) {
      assert.match(checkOriginal(name, cleanJpeg()).join(), /slug/, name);
    }
  });

  test('rechaza un original con metadatos y dice cuáles', () => {
    assert.deepEqual(checkOriginal('faro.jpg', cleanJpeg(EXIF_GPS)), [
      'trae metadatos: APP1 Exif',
    ]);
  });

  test('rechaza un archivo que no es JPEG', () => {
    assert.match(checkOriginal('faro.jpg', notJpeg()).join(), /no es un JPEG/);
  });
});

describe('cleanOriginal', () => {
  let dir = '';
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'originals-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true });
  });

  test('escribe el original sin metadatos y dice qué quitó', () => {
    const source = join(dir, '000031 (2).JPG');
    writeFileSync(source, cleanJpeg(EXIF_GPS, XMP, IPTC));
    const target = join(dir, 'faro.jpg');

    const removed = cleanOriginal(source, target);

    assert.deepEqual(removed, ['APP1 Exif', 'APP1 XMP', 'APP13 IPTC']);
    assert.deepEqual(new Uint8Array(readFileSync(target)), cleanJpeg());
    assert.deepEqual(
      new Uint8Array(readFileSync(source)),
      cleanJpeg(EXIF_GPS, XMP, IPTC),
      'no toca el archivo de origen',
    );
  });

  test('no sobrescribe un original que ya existe', () => {
    const source = join(dir, 'escaneo.jpg');
    writeFileSync(source, cleanJpeg(EXIF_GPS));
    const target = join(dir, 'faro.jpg');
    writeFileSync(target, 'ya estaba');

    assert.throws(() => cleanOriginal(source, target), /EEXIST/);
    assert.equal(readFileSync(target, 'utf8'), 'ya estaba');
  });

  test('no escribe nada si el destino no es un slug', () => {
    const source = join(dir, 'escaneo.jpg');
    writeFileSync(source, cleanJpeg(EXIF_GPS));

    assert.throws(() => cleanOriginal(source, join(dir, 'Faro.JPG')), /slug/);
  });
});
