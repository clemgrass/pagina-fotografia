# Cuenta de Cloudflare

Pasos manuales para dejar listo el hosting (ADR 0001 y 0017). Los hace una persona en el
dashboard: la IA no toca la infraestructura, y nadie corre `wrangler login` en su máquina
(ADR 0014). Verificado contra la documentación de Cloudflare el 2026-11-27. Los nombres de
menú marcados "(no verificado)" pueden haber cambiado.

## 1. Crear la cuenta

1. Entra a <https://dash.cloudflare.com/sign-up> y crea la cuenta con tu correo.
2. Si en algún paso te pide tarjeta, **detente**: el stack tiene que ser 100 % gratis.
3. Activa la verificación en dos pasos. Esta cuenta va a publicar el sitio.

## 2. Elegir el subdominio

La URL del sitio queda `foto.<subdominio>.workers.dev`. `foto` es el `name` de
`wrangler.jsonc`.

1. Ve a **Workers & Pages**.
2. Elige el subdominio de la cuenta. Si ya tiene uno, cámbialo con **Change**, junto a
   **Your subdomain**.

## 3. Crear el Worker `foto`

El token solo puede editar un Worker que ya existe (ADR 0017), así que se crea a mano una
vez. El primer deploy de la CI lo reemplaza por el sitio.

1. En **Workers & Pages**, crea una aplicación desde la plantilla "Hello World".
2. Ponle de nombre `foto`, exacto, y despliégala.
3. Comprueba que `https://foto.<subdominio>.workers.dev` muestra "Hello World!".

## 4. Copiar el ID de la cuenta

Abre la búsqueda del dashboard (Ctrl + K), escribe "Copy account ID" y elige el resultado.
No es una credencial, pero va como secreto en GitHub, igual que el token.

## 5. Crear el token

1. Ve a **Manage account** → **Account API tokens** → **Create Token**.
2. Nombre: `github-actions-deploy-foto`.
3. Permiso: Workers, rol **Editor**, con recurso **Individual Workers** y solo `foto`
   elegido. El resumen del token tiene que decir "Individual Workers · Editor". Si el
   formulario solo ofrece todos los Workers o la cuenta completa, **detente**: no elijas
   Admin para salir del paso.
4. Vencimiento: un año desde hoy.
5. Sin filtro de IP: los runners de GitHub no tienen IP fija.
6. Revisa el resumen y crea el token. Cloudflare lo muestra **una sola vez**: pégalo
   directo en GitHub (paso 6). No lo guardes en archivos ni lo pegues en un chat.

## 6. Crear el environment `production` en GitHub

1. En el repo: **Settings** → **Environments** → **New environment**, nombre `production`.
2. **Deployment branches and tags**: **Selected branches and tags**, y agrega `main`.
3. **Environment secrets**: agrega `CLOUDFLARE_API_TOKEN` (el token) y
   `CLOUDFLARE_ACCOUNT_ID` (el ID de la cuenta).

Para comprobarlo, corre `gh secret list --env production`: muestra los nombres, nunca los
valores.

## Uso y límites del plan gratis

- Las peticiones a los assets son gratis e ilimitadas. El sitio no tiene script, así que
  el tope diario de 100.000 invocaciones de Workers no le aplica.
- Cada versión admite hasta 20.000 archivos, de 25 MiB como máximo cada uno.
- Sin tarjeta registrada, Cloudflare no tiene cómo cobrar: un límite superado falla, no
  cobra.
- El uso se ve en **Workers & Pages** → **Overview**, y el de cada Worker en su pestaña
  **Metrics** (no verificado). No está verificado si muestran las peticiones servidas
  directo desde los assets (ADR 0001).

## Renovar el token

Antes de que venza, o apenas se sospeche una filtración:

1. Crea un token nuevo con el paso 5.
2. Reemplaza `CLOUDFLARE_API_TOKEN` en el environment `production`.
3. Revoca el token anterior en **Account API tokens**.

## Fuentes (2026-11-27)

- developers.cloudflare.com/workers/configuration/routing/workers-dev
- developers.cloudflare.com/workers/authorization
- developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens
- developers.cloudflare.com/fundamentals/api/get-started/create-token
- developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids
- developers.cloudflare.com/workers/static-assets/billing-and-limitations
- developers.cloudflare.com/workers/platform/limits
- docs.github.com: managing-environments-for-deployment
