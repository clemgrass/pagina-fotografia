// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

// Los originales de photos/originals/: sin metadatos y con nombre en slug
// (ADR 0003). Dos comandos:
//   node scripts/photos/originals.ts clean <escaneo> photos/originals/<slug>.jpg
//   node scripts/photos/originals.ts check

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import { findMetadata, stripMetadata } from './jpeg-metadata.ts';

export const ORIGINALS_DIR = 'photos/originals';

// El nombre del archivo es el slug de la foto: minúsculas, números y guiones
// simples, sin tildes ni espacios.
const SLUG_JPG = /^[a-z0-9]+(?:-[a-z0-9]+)*\.jpg$/;
const SLUG_ERROR = 'el nombre no es un slug en minúsculas terminado en .jpg';

/** Errores de un original, en español. Vacío si está bien. */
export function checkOriginal(name: string, jpeg: Uint8Array): string[] {
  const errors = SLUG_JPG.test(name) ? [] : [SLUG_ERROR];
  try {
    for (const found of findMetadata(jpeg)) {
      errors.push(`trae metadatos: ${found}`);
    }
  } catch (error) {
    errors.push((error as Error).message);
  }
  return errors;
}

/**
 * Copia un escaneo a `target` sin metadatos. No toca el escaneo y nunca
 * sobrescribe un original. Devuelve los metadatos que quitó.
 */
export function cleanOriginal(source: string, target: string): string[] {
  if (!SLUG_JPG.test(basename(target))) {
    throw new Error(`${target}: ${SLUG_ERROR}`);
  }
  const scan = readFileSync(source);
  const removed = findMetadata(scan);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, stripMetadata(scan), { flag: 'wx' });
  return removed;
}

function check(): boolean {
  let ok = true;
  const names = readdirSync(ORIGINALS_DIR).sort();
  for (const name of names) {
    const errors = checkOriginal(name, readFileSync(join(ORIGINALS_DIR, name)));
    for (const error of errors)
      console.error(`${ORIGINALS_DIR}/${name}: ${error}`);
    if (errors.length > 0) ok = false;
  }
  if (ok) console.log(`${names.length} originales sin metadatos.`);
  return ok;
}

if (import.meta.main) {
  const [command, source, target] = process.argv.slice(2);
  if (command === 'check') {
    if (!check()) process.exit(1);
  } else if (command === 'clean' && source && target) {
    const removed = cleanOriginal(source, target);
    console.log(`${target}: quitado ${removed.join(', ') || 'nada'}.`);
  } else {
    console.error(
      'Uso: originals.ts check | originals.ts clean <escaneo> <destino.jpg>',
    );
    process.exit(2);
  }
}
