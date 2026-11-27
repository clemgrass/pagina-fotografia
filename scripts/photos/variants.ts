// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

// Genera las variantes AVIF y JPEG de cada original (ADR 0004):
//   node scripts/photos/variants.ts
// Lee photos/originals/, escribe en public/photos/ y deja el manifiesto con
// medidas y color dominante en .cache/photos.json.

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

import sharp from 'sharp';

import { ORIGINALS_DIR } from './originals.ts';

export const OUTPUT_DIR = 'public/photos';
export const MANIFEST = '.cache/photos.json';

// En una galería la RAM se va en píxeles decodificados: cada pantalla pide el
// ancho justo. Ningún lado pasa de 2048 px.
export const WIDTHS = [480, 960, 1440, 2048] as const;
const MAX_SIDE = 2048;

// Calidades provisorias: se eligen a la vista contra los escaneos (ADR 0004).
// effort 2 en AVIF: 7 veces más rápido que 4 y solo un 3 % más pesado,
// medido con anden-del-metro a 2043 px (2,5 s contra 17 s).
const ENCODERS = {
  avif: { quality: 60, effort: 2 },
  jpeg: { quality: 80, mozjpeg: true },
} as const;
type Format = keyof typeof ENCODERS;

export interface Variant {
  format: Format;
  width: number;
  height: number;
  /** Nombre del archivo dentro de la carpeta de salida. */
  file: string;
}

export interface PhotoVariants {
  slug: string;
  width: number;
  height: number;
  /** Color dominante en hex, para el placeholder. */
  color: string;
  variants: Variant[];
}

export interface BuildResult {
  photos: PhotoVariants[];
  /** Archivos escritos en esta corrida. */
  generated: string[];
  /** Archivos viejos que ya no corresponden a ningún original. */
  removed: string[];
}

/** Anchos de las variantes: los estándar que caben, más el mayor posible. */
export function variantWidths(width: number, height: number): number[] {
  if (![width, height].every((n) => Number.isInteger(n) && n > 0)) {
    throw new Error(`medidas inválidas: ${width} × ${height}`);
  }
  const largest = Math.min(
    width,
    Math.floor((MAX_SIDE * width) / Math.max(width, height)),
  );
  return [...WIDTHS.filter((w) => w < largest), largest];
}

// Cambiar la calidad, los anchos o la versión de sharp cambia el hash, y con
// él los nombres: las variantes se regeneran solas.
const PARAMS = JSON.stringify({
  ENCODERS,
  WIDTHS,
  MAX_SIDE,
  ...sharp.versions,
});

const hex = (n: number) => n.toString(16).padStart(2, '0');

async function buildPhoto(
  original: string,
  outDir: string,
  generated: string[],
): Promise<PhotoVariants> {
  const input = await readFile(original);
  const slug = basename(original, '.jpg');
  const hash = createHash('sha256')
    .update(input)
    .update(PARAMS)
    .digest('hex')
    .slice(0, 10);

  const { width, height } = await sharp(input).metadata();
  const { r, g, b } = (await sharp(input).stats()).dominant;

  const variants = variantWidths(width, height).flatMap((w) =>
    (Object.keys(ENCODERS) as Format[]).map((format) => ({
      format,
      width: w,
      height: Math.round((w * height) / width),
      file: `${slug}-${w}.${hash}.${format === 'jpeg' ? 'jpg' : format}`,
    })),
  );

  await Promise.all(
    variants
      .filter(({ file }) => !existsSync(join(outDir, file)))
      .map(async ({ format, width: w, height: h, file }) => {
        // Se escribe aparte y se renombra: una corrida cortada no deja un
        // archivo a medias que la caché daría por bueno.
        const target = join(outDir, file);
        await sharp(input)
          .resize({ width: w, height: h, fit: 'fill' })
          [format](ENCODERS[format])
          .toFile(`${target}.tmp`);
        await rename(`${target}.tmp`, target);
        generated.push(file);
      }),
  );

  return {
    slug,
    width,
    height,
    color: `#${hex(r)}${hex(g)}${hex(b)}`,
    variants,
  };
}

/**
 * Genera lo que falta en `outDir` y borra lo que sobra. sharp entrega sRGB y
 * sin metadatos por defecto: convierte con el ICC del original y no lo copia.
 */
export async function buildVariants(
  originals: string[],
  outDir: string,
): Promise<BuildResult> {
  await mkdir(outDir, { recursive: true });
  const generated: string[] = [];
  const photos: PhotoVariants[] = [];
  // Una foto a la vez: cada una decodifica el original varias veces.
  for (const original of originals) {
    try {
      photos.push(await buildPhoto(original, outDir, generated));
    } catch (error) {
      throw new Error(`${original}: ${(error as Error).message}`, {
        cause: error,
      });
    }
  }

  const expected = new Set(
    photos.flatMap((p) => p.variants.map((v) => v.file)),
  );
  const removed = (await readdir(outDir)).filter((name) => !expected.has(name));
  await Promise.all(removed.map((name) => rm(join(outDir, name))));

  return { photos, generated: generated.sort(), removed: removed.sort() };
}

if (import.meta.main) {
  const names = (await readdir(ORIGINALS_DIR)).sort();
  const started = performance.now();
  const { photos, generated, removed } = await buildVariants(
    names.map((name) => join(ORIGINALS_DIR, name)),
    OUTPUT_DIR,
  );
  await mkdir(dirname(MANIFEST), { recursive: true });
  await writeFile(MANIFEST, `${JSON.stringify(photos, null, 2)}\n`);
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  console.log(
    `${photos.length} fotos: ${generated.length} variantes nuevas, ` +
      `${removed.length} borradas (${seconds} s).`,
  );
}
