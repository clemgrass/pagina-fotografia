// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

// Lee la versión activa del Worker antes de publicar, para que el rollback
// vuelva a esa versión exacta y no a "la anterior", que puede ser un intento
// fallido del mismo deploy (ADR 0013).
// Uso: wrangler deployments status --json | node scripts/deployment.ts

import { readFileSync } from 'node:fs';

/** ID de la única versión al 100 % en la salida de `deployments status --json`. */
export function activeVersionId(json: string): string {
  let deployment: unknown;
  try {
    deployment = JSON.parse(json);
  } catch {
    throw new Error(`la salida de Wrangler no es JSON: ${json.trim()}`);
  }

  const versions = (deployment as { versions?: unknown } | null)?.versions;
  if (!Array.isArray(versions)) {
    throw new Error('la salida de Wrangler no trae "versions"');
  }

  const [only] = versions as { version_id?: unknown; percentage?: unknown }[];
  if (versions.length !== 1 || only?.percentage !== 100) {
    throw new Error(
      'hay un deploy gradual en curso: no hay una sola versión al 100 %',
    );
  }
  if (typeof only.version_id !== 'string' || only.version_id === '') {
    throw new Error('la versión activa no trae "version_id"');
  }
  return only.version_id;
}

if (import.meta.main) {
  try {
    console.log(activeVersionId(readFileSync(0, 'utf8')));
  } catch (error) {
    console.error(
      `No se pudo leer la versión activa: ${(error as Error).message}`,
    );
    process.exit(1);
  }
}
