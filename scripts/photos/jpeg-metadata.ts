// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

// Encuentra y quita los metadatos de un JPEG sin volver a codificarlo
// (ADR 0003 y 0004). Trabaja sobre los segmentos: copia tal cual los que
// describen la imagen y deja fuera el resto. Los datos de imagen no se tocan.

/** Un segmento desde su FF hasta el siguiente marcador. */
interface Segment {
  marker: number;
  start: number;
  /** Exclusivo. En un SOS incluye los datos de imagen que lo siguen. */
  end: number;
  /** Los bytes después del largo. */
  payload: Uint8Array;
}

interface Parsed {
  segments: Segment[];
  /** Posición del FF D9 que cierra la imagen. */
  eoi: number;
}

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const COM = 0xfe;

const hex = (byte: number) => byte.toString(16).toUpperCase().padStart(2, '0');

/** Avanza por los datos de imagen hasta el próximo marcador real. */
function skipScan(jpeg: Uint8Array, from: number): number {
  for (let i = from; i + 1 < jpeg.length; i++) {
    if (jpeg[i] !== 0xff) continue;
    const next = jpeg[i + 1]!;
    // FF 00 es un FF de los datos, FF D0-D7 reinicia el barrido y FF FF rellena.
    if (next === 0x00 || (next >= 0xd0 && next <= 0xd7) || next === 0xff) {
      continue;
    }
    return i;
  }
  return jpeg.length;
}

function parse(jpeg: Uint8Array): Parsed {
  if (jpeg[0] !== 0xff || jpeg[1] !== SOI) {
    throw new Error('no es un JPEG: no empieza con FF D8');
  }
  const segments: Segment[] = [];
  let pos = 2;
  for (;;) {
    if (pos + 1 >= jpeg.length) {
      throw new Error('JPEG sin fin de imagen (FF D9)');
    }
    if (jpeg[pos] !== 0xff) {
      throw new Error(`JPEG inválido: falta un marcador en el byte ${pos}`);
    }
    const start = pos;
    while (jpeg[pos + 1] === 0xff) pos++;
    const marker = jpeg[pos + 1]!;
    if (marker === EOI) return { segments, eoi: pos };

    const length = ((jpeg[pos + 2] ?? 0) << 8) | (jpeg[pos + 3] ?? 0);
    let end = pos + 2 + length;
    if (length < 2 || end > jpeg.length) {
      throw new Error(
        `JPEG cortado en el segmento ${hex(marker)} del byte ${pos}`,
      );
    }
    const payload = jpeg.subarray(pos + 4, end);
    if (marker === SOS) end = skipScan(jpeg, end);
    segments.push({ marker, start, end, payload });
    pos = end;
  }
}

/** El identificador ASCII con que empieza un segmento APPn, hasta el primer 0. */
function identifierOf(payload: Uint8Array): string {
  const zero = payload.indexOf(0);
  const bytes = payload.subarray(0, zero === -1 ? 32 : Math.min(zero, 32));
  return String.fromCharCode(...bytes).replace(/[^\x20-\x7e]/g, '?');
}

/**
 * Lista permitida de segmentos APPn: true si el segmento describe cómo se ve la
 * imagen y se conserva; false si es metadato y sale.
 *
 * `app` es n en APPn (0 a 15), `id` es el identificador con que empieza
 * (`JFIF`, `ICC_PROFILE`, `Exif`, `Adobe`…) y `payload` son sus bytes, desde
 * el identificador.
 */
export function keepAppSegment(
  app: number,
  id: string,
  payload: Uint8Array,
): boolean {
  switch (`APP${app} ${id}`) {
    // JFIF sin miniatura: los bytes 12 y 13 son su ancho y su alto.
    case 'APP0 JFIF':
      return payload[12] === 0 && payload[13] === 0;
    // El perfil de color, que puede venir partido en varios segmentos.
    case 'APP2 ICC_PROFILE':
      return true;
    // Dice si los datos están en YCbCr o en RGB: sin él cambian los colores.
    case 'APP14 Adobe':
      return true;
    default:
      return false;
  }
}

const NAMES: Record<string, string> = {
  'http://ns.adobe.com/xap/1.0/': 'XMP',
  'Photoshop 3.0': 'IPTC',
  JFIF: 'JFIF con miniatura',
};

/** Nombre legible de un segmento de metadatos, o null si se conserva. */
function metadataName({ marker, payload }: Segment): string | null {
  if (marker === COM) return 'COM';
  if (marker < 0xe0 || marker > 0xef) return null;
  const app = marker - 0xe0;
  const id = identifierOf(payload);
  if (keepAppSegment(app, id, payload)) return null;
  return `APP${app} ${NAMES[id] ?? id}`.trimEnd();
}

/** Los metadatos que trae el JPEG, en orden. Vacío si está limpio. */
export function findMetadata(jpeg: Uint8Array): string[] {
  const { segments, eoi } = parse(jpeg);
  const found = segments.flatMap((segment) => metadataName(segment) ?? []);
  if (eoi + 2 < jpeg.length) found.push('datos después de EOI');
  return found;
}

/** Una copia del JPEG sin metadatos. Los segmentos que quedan van tal cual. */
export function stripMetadata(jpeg: Uint8Array): Uint8Array {
  const { segments, eoi } = parse(jpeg);
  const parts = [
    jpeg.subarray(0, 2),
    ...segments
      .filter((segment) => metadataName(segment) === null)
      .map(({ start, end }) => jpeg.subarray(start, end)),
    jpeg.subarray(eoi, eoi + 2),
  ];
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
