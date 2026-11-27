// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

// Valida el encabezado de un commit con Conventional Commits (ADR 0014).
// Lo usan el hook commit-msg y el check del título del PR en la CI:
//   node scripts/commit-message.ts < .git/COMMIT_EDITMSG
//   printf '%s' "$PR_TITLE" | node scripts/commit-message.ts

import { readFileSync } from 'node:fs';

export const TYPES = [
  'build',
  'chore',
  'ci',
  'docs',
  'feat',
  'fix',
  'perf',
  'refactor',
  'revert',
  'style',
  'test',
] as const;

// El valor por defecto de commitlint. Cabe el título que arma Dependabot:
// "ci(deps): Bump <paquete> from X to Y in the <grupo> group".
export const MAX_HEADER_LENGTH = 100;

/** Primera línea con contenido, sin los comentarios que agrega git. */
export function headerOf(message: string): string {
  const lines = message.split('\n').map((line) => line.trimEnd());
  return lines.find((line) => line !== '' && !line.startsWith('#')) ?? '';
}

// tipo(scope)!: descripción. El tipo acepta mayúsculas para que "Feat" reciba
// un error específico y no uno de formato.
const HEADER =
  /^(?<type>[A-Za-z]+)(?:\([a-z0-9-]+\))?!?: (?<description>\S.*)$/;

// El encabezado que escribe `git merge` al actualizar una rama con main.
const GIT_MERGE = /^Merge (?:remote-tracking )?branch '/;

/** Lista de errores del encabezado, en español. Vacía si es válido. */
export function checkHeader(header: string): string[] {
  if (GIT_MERGE.test(header)) return [];

  const { type = '', description = '' } = HEADER.exec(header)?.groups ?? {};
  if (type === '') {
    return ['falta "tipo: descripción", con un espacio tras ":"'];
  }

  const errors: string[] = [];
  if (!(TYPES as readonly string[]).includes(type)) {
    errors.push(`el tipo "${type}" no es de Conventional Commits`);
  }
  if (header.length > MAX_HEADER_LENGTH) {
    errors.push(
      `tiene ${header.length} caracteres; el máximo es ${MAX_HEADER_LENGTH}`,
    );
  }
  if (description.endsWith('.')) {
    errors.push('la descripción no termina en punto');
  }
  return errors;
}

if (import.meta.main) {
  const header = headerOf(readFileSync(0, 'utf8'));
  const errors = checkHeader(header);
  if (errors.length > 0) {
    console.error(`Encabezado inválido: "${header}"`);
    for (const error of errors) console.error(`- ${error}`);
    console.error(
      `Formato: tipo(scope opcional)!: descripción. Tipos: ${TYPES.join(', ')}.`,
    );
    process.exit(1);
  }
}
