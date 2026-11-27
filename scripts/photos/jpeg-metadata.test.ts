// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  ADOBE,
  COMMENT,
  DHT,
  EOI,
  EXIF_GPS,
  ICC,
  IPTC,
  JFIF,
  JFIF_WITH_THUMBNAIL,
  JFXX,
  MPF,
  SCAN,
  SOF0,
  SOI,
  SOS,
  TRAILING,
  XMP,
  cleanJpeg,
  jpeg,
  notJpeg,
} from './jpeg-fixtures.ts';
import { findMetadata, stripMetadata } from './jpeg-metadata.ts';

describe('findMetadata', () => {
  test('no encuentra nada en un JPEG con JFIF, ICC y Adobe', () => {
    assert.deepEqual(findMetadata(cleanJpeg()), []);
  });

  test('encuentra el EXIF con GPS, el XMP y el IPTC de un escaneo', () => {
    const found = findMetadata(cleanJpeg(EXIF_GPS, XMP, IPTC));
    assert.deepEqual(found, ['APP1 Exif', 'APP1 XMP', 'APP13 IPTC']);
  });

  test('encuentra comentarios, MPF, JFXX y miniaturas JFIF', () => {
    const found = findMetadata(
      jpeg(SOI, JFIF_WITH_THUMBNAIL, JFXX, MPF, COMMENT, SOF0, SOS, SCAN, EOI),
    );
    assert.deepEqual(found, [
      'APP0 JFIF con miniatura',
      'APP0 JFXX',
      'APP2 MPF',
      'COM',
    ]);
  });

  test('encuentra metadatos entre dos barridos de un JPEG progresivo', () => {
    const progressive = jpeg(
      SOI,
      JFIF,
      SOF0,
      DHT,
      SOS,
      SCAN,
      XMP,
      SOS,
      SCAN,
      EOI,
    );
    assert.deepEqual(findMetadata(progressive), ['APP1 XMP']);
  });

  test('encuentra datos escondidos después del fin de imagen', () => {
    const trailing = jpeg(SOI, JFIF, SOF0, SOS, SCAN, EOI, TRAILING);
    assert.deepEqual(findMetadata(trailing), ['datos después de EOI']);
  });

  test('rechaza un archivo que no es JPEG', () => {
    assert.throws(() => findMetadata(notJpeg()), /no es un JPEG/);
  });

  test('rechaza un JPEG cortado a mitad de un segmento', () => {
    const cut = cleanJpeg(EXIF_GPS).subarray(0, 30);
    assert.throws(() => findMetadata(cut), /cortado/);
  });

  test('rechaza un JPEG sin fin de imagen', () => {
    assert.throws(
      () => findMetadata(jpeg(SOI, JFIF, SOF0, SOS, SCAN)),
      /sin fin de imagen/,
    );
  });
});

describe('stripMetadata', () => {
  test('quita EXIF, XMP e IPTC y deja el resto idéntico byte a byte', () => {
    const scanned = cleanJpeg(EXIF_GPS, XMP, IPTC);
    assert.deepEqual(stripMetadata(scanned), cleanJpeg());
  });

  test('conserva el ICC, el JFIF sin miniatura y el segmento Adobe', () => {
    const stripped = Buffer.from(stripMetadata(cleanJpeg(COMMENT)));
    assert.deepEqual(findMetadata(stripped), []);
    for (const kept of [JFIF, ICC, ADOBE]) {
      assert.ok(stripped.includes(Buffer.from(kept)));
    }
  });

  test('quita los metadatos entre barridos y los datos tras el fin de imagen', () => {
    const dirty = jpeg(SOI, SOF0, SOS, SCAN, XMP, SOS, SCAN, EOI, TRAILING);
    const expected = jpeg(SOI, SOF0, SOS, SCAN, SOS, SCAN, EOI);
    assert.deepEqual(stripMetadata(dirty), expected);
  });

  test('devuelve igual un JPEG que ya está limpio', () => {
    assert.deepEqual(stripMetadata(cleanJpeg()), cleanJpeg());
  });

  test('no limpia un archivo que no es JPEG', () => {
    assert.throws(() => stripMetadata(notJpeg()), /no es un JPEG/);
  });
});
