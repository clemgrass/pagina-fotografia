// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

// JPEG sintéticos para los tests: la estructura de segmentos es real, la imagen
// no se puede decodificar. Basta para probar qué segmentos se quitan y que el
// resto queda idéntico byte a byte.

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

/** Segmento con largo: FF, marcador, largo de 2 bytes (incluye el largo) y datos. */
function segment(marker: number, payload: number[]): number[] {
  const length = payload.length + 2;
  return [0xff, marker, length >> 8, length & 0xff, ...payload];
}

export const SOI = [0xff, 0xd8];
export const EOI = [0xff, 0xd9];
export const TRAILING = ascii('extra');

export const JFIF = segment(0xe0, [
  ...ascii('JFIF\0'),
  ...[1, 2, 0, 0, 1, 0, 1],
  ...[0, 0], // sin miniatura
]);
export const JFIF_WITH_THUMBNAIL = segment(0xe0, [
  ...ascii('JFIF\0'),
  ...[1, 2, 0, 0, 1, 0, 1],
  ...[1, 1, 0xaa, 0xbb, 0xcc], // miniatura de 1×1 px en RGB, sin comprimir
]);
export const JFXX = segment(0xe0, [
  ...ascii('JFXX\0'),
  ...[0x10, 0xff, 0xd8, 0xff, 0xd9],
]);
export const ICC = segment(0xe2, [
  ...ascii('ICC_PROFILE\0'),
  ...[1, 1, 0x00, 0x11, 0x22],
]);
export const MPF = segment(0xe2, [...ascii('MPF\0'), 0x4d, 0x4d, 0x00, 0x2a]);
export const ADOBE = segment(0xee, [...ascii('Adobe'), 0, 100, 0, 0, 0, 0, 1]);

// EXIF con un IFD de GPS falso (tag 0x8825) y una latitud inventada.
export const EXIF_GPS = segment(0xe1, [
  ...ascii('Exif\0\0'),
  ...[0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08],
  ...[0x00, 0x01, 0x88, 0x25, 0x00, 0x04, 0x00, 0x00, 0x00, 0x01],
  ...[0x00, 0x00, 0x00, 0x1a, 0x00, 0x00, 0x00, 0x00],
  ...ascii('GPS -33.45 -70.66'),
]);
export const XMP = segment(0xe1, [
  ...ascii('http://ns.adobe.com/xap/1.0/\0'),
  ...ascii('<x:xmpmeta/>'),
]);
export const IPTC = segment(0xed, [
  ...ascii('Photoshop 3.0\0'),
  ...ascii('8BIM'),
]);
export const COMMENT = segment(0xfe, ascii('escaneado por alguien'));

// Tablas y cabecera de cuadro mínimas: lo que un JPEG real trae siempre.
export const DQT = segment(0xdb, [0x00, ...Array<number>(64).fill(1)]);
export const DRI = segment(0xdd, [0x00, 0x10]);
export const SOF0 = segment(0xc0, [8, 0, 16, 0, 16, 1, 1, 0x11, 0]);
export const DHT = segment(0xc4, [0x00, ...Array<number>(16).fill(0)]);
export const SOS = segment(0xda, [1, 1, 0x00, 0, 63, 0]);

// Datos de imagen con un byte relleno (FF 00) y un marcador de reinicio (FF D0),
// que no son segmentos y no tienen largo.
export const SCAN = [0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56];

export const jpeg = (...parts: number[][]) => Uint8Array.from(parts.flat());

/** JPEG limpio con los segmentos que se conservan, más los que se pasen. */
export const cleanJpeg = (...extra: number[][]) =>
  jpeg(SOI, JFIF, ICC, ADOBE, ...extra, DQT, DRI, SOF0, DHT, SOS, SCAN, EOI);

export const notJpeg = () => Uint8Array.from(ascii('\x89PNG\r\n'));
