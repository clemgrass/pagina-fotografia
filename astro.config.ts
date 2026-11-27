// SPDX-FileCopyrightText: 2026 clemgrass
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'astro/config';

export default defineConfig({
  // Español en `/` e inglés en `/en/`, sin redirección (ADR 0008).
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: false },
  },
});
