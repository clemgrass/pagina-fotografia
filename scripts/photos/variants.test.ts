// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';

import sharp from 'sharp';

import { findMetadata } from './jpeg-metadata.ts';
import { buildVariants, variantWidths } from './variants.ts';

describe('variantWidths', () => {
  test('una foto horizontal de 2043 px llega hasta su ancho, sin ampliar', () => {
    assert.deepEqual(variantWidths(2043, 1381), [480, 960, 1440, 2043]);
  });

  test('una foto vertical se limita por su ancho', () => {
    assert.deepEqual(variantWidths(1228, 1818), [480, 960, 1228]);
  });

  test('ningún lado pasa de 2048 px en una foto grande', () => {
    assert.deepEqual(variantWidths(4000, 3000), [480, 960, 1440, 2048]);
    // Vertical: 1536 × 2048.
    assert.deepEqual(variantWidths(3000, 4000), [480, 960, 1440, 1536]);
  });

  test('una foto más chica que 480 px queda en su tamaño', () => {
    assert.deepEqual(variantWidths(300, 200), [300]);
  });

  test('rechaza medidas que no son enteros positivos', () => {
    assert.throws(() => variantWidths(0, 100), /medidas/);
    assert.throws(() => variantWidths(100, -1), /medidas/);
    assert.throws(() => variantWidths(10.5, 100), /medidas/);
  });
});

/** Un JPEG de color sólido, opcionalmente con EXIF y perfil ICC. */
async function solidJpeg(
  file: string,
  width: number,
  height: number,
  rgb: [number, number, number],
  options: { gps?: boolean; icc?: string } = {},
): Promise<void> {
  let image = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: rgb[0], g: rgb[1], b: rgb[2] },
    },
  });
  if (options.gps) {
    image = image.withExif({
      IFD0: { Make: 'Cámara falsa' },
      IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '33/1 27/1 0/1' },
    });
  }
  if (options.icc) image = image.withIccProfile(options.icc);
  await image.jpeg({ quality: 95 }).toFile(file);
}

/** El color del píxel central de una imagen, en sRGB tal como se guardó. */
async function centerPixel(file: string): Promise<number[]> {
  const { data, info } = await sharp(file)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const center =
    (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) *
    info.channels;
  return [...data.subarray(center, center + 3)];
}

const near = (actual: number[], expected: number[], tolerance: number) =>
  actual.every((value, i) => Math.abs(value - expected[i]!) <= tolerance);

describe('buildVariants', () => {
  let dir = '';
  let originals = '';
  let out = '';
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'variants-'));
    originals = join(dir, 'originals');
    out = join(dir, 'out');
    mkdirSync(originals);
  });
  afterEach(() => {
    rmSync(dir, { recursive: true });
  });

  test('genera AVIF y JPEG de cada ancho, sin metadatos y hasta 2048 px', async () => {
    await solidJpeg(join(originals, 'faro.jpg'), 4000, 3000, [90, 140, 200], {
      gps: true,
      icc: 'p3',
    });

    const { photos, generated } = await buildVariants(
      [join(originals, 'faro.jpg')],
      out,
    );

    const [photo] = photos;
    assert.equal(photo?.slug, 'faro');
    assert.deepEqual([photo?.width, photo?.height], [4000, 3000]);
    assert.deepEqual(
      photo?.variants.map((v) => `${v.format} ${v.width}×${v.height}`),
      [
        'avif 480×360',
        'jpeg 480×360',
        'avif 960×720',
        'jpeg 960×720',
        'avif 1440×1080',
        'jpeg 1440×1080',
        'avif 2048×1536',
        'jpeg 2048×1536',
      ],
    );
    assert.equal(generated.length, 8);
    for (const variant of photo?.variants ?? []) {
      const file = join(out, variant.file);
      const meta = await sharp(file).metadata();
      assert.equal(meta.format, variant.format === 'avif' ? 'heif' : 'jpeg');
      assert.deepEqual(
        [meta.width, meta.height],
        [variant.width, variant.height],
      );
      assert.ok(Math.max(meta.width, meta.height) <= 2048, variant.file);
      assert.equal(meta.exif, undefined, `${variant.file} sin EXIF`);
      assert.equal(meta.icc, undefined, `${variant.file} sin ICC`);
      assert.equal(meta.xmp, undefined, `${variant.file} sin XMP`);
      if (variant.format === 'jpeg') {
        assert.deepEqual(findMetadata(readFileSync(file)), [], variant.file);
      }
    }
  });

  test('convierte a sRGB un original con perfil Display P3', async () => {
    // withIccProfile convierte el sRGB pedido a P3: los números guardados
    // cambian. ignoreIcc los lee tal cual, sin volver a convertirlos.
    const original = join(originals, 'p3.jpg');
    await solidJpeg(original, 64, 64, [200, 100, 50], { icc: 'p3' });
    const stored = await sharp(original, { ignoreIcc: true }).raw().toBuffer();
    assert.ok(
      !near([...stored.subarray(0, 3)], [200, 100, 50], 5),
      'el original no está en sRGB',
    );

    const { photos } = await buildVariants([original], out);

    const jpeg = photos[0]?.variants.find((v) => v.format === 'jpeg');
    assert.ok(jpeg);
    const pixel = await centerPixel(join(out, jpeg.file));
    assert.ok(near(pixel, [200, 100, 50], 4), `quedó ${pixel.join(', ')}`);
  });

  test('calcula el color dominante para el placeholder', async () => {
    await solidJpeg(join(originals, 'cielo.jpg'), 64, 48, [40, 120, 200]);

    const { photos } = await buildVariants([join(originals, 'cielo.jpg')], out);

    const color = photos[0]?.color ?? '';
    assert.match(color, /^#[0-9a-f]{6}$/);
    const rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
    assert.ok(near(rgb, [40, 120, 200], 16), `quedó ${color}`);
  });

  test('una segunda corrida sin cambios no regenera nada', async () => {
    await solidJpeg(join(originals, 'faro.jpg'), 1000, 600, [90, 140, 200]);
    const first = await buildVariants([join(originals, 'faro.jpg')], out);
    const mtimes = readdirSync(out).map(
      (name) => statSync(join(out, name)).mtimeMs,
    );

    const second = await buildVariants([join(originals, 'faro.jpg')], out);

    assert.equal(first.generated.length, 6);
    assert.deepEqual(second.generated, []);
    assert.deepEqual(second.removed, []);
    assert.deepEqual(second.photos, first.photos);
    assert.deepEqual(
      readdirSync(out).map((name) => statSync(join(out, name)).mtimeMs),
      mtimes,
    );
  });

  test('si cambia el original, regenera sus variantes y borra las viejas', async () => {
    const original = join(originals, 'faro.jpg');
    await solidJpeg(original, 600, 400, [90, 140, 200]);
    const first = await buildVariants([original], out);
    await solidJpeg(original, 600, 400, [200, 60, 40]);

    const second = await buildVariants([original], out);

    assert.equal(second.generated.length, 4);
    assert.deepEqual(second.removed.sort(), first.generated.sort());
    assert.deepEqual(readdirSync(out).sort(), second.generated.sort());
  });

  test('borra las variantes de una foto que ya no está', async () => {
    await solidJpeg(join(originals, 'faro.jpg'), 600, 400, [90, 140, 200]);
    await solidJpeg(join(originals, 'muelle.jpg'), 600, 400, [20, 40, 60]);
    await buildVariants(
      [join(originals, 'faro.jpg'), join(originals, 'muelle.jpg')],
      out,
    );

    const { removed } = await buildVariants([join(originals, 'faro.jpg')], out);

    assert.equal(removed.length, 4);
    assert.ok(removed.every((name) => name.startsWith('muelle-')));
  });

  test('falla con el nombre del archivo si un original no es una imagen', async () => {
    const broken = join(originals, 'roto.jpg');
    writeFileSync(broken, 'no es un JPEG');

    await assert.rejects(buildVariants([broken], out), /roto\.jpg/);
  });
});
