// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'astro/config';

export default defineConfig({
  // Nada de CSS inline: la CSP solo permite `style-src 'self'` (ADR 0007).
  build: { inlineStylesheets: 'never' },
  // Español en `/` e inglés en `/en/`, sin redirección (ADR 0008).
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: false },
  },
});
