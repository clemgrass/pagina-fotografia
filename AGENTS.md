# AGENTS.md

Portafolio de fotografía análoga (35 mm, sin personas) y explicador de cómo funciona una
cámara análoga. Sitio estático en español (`/`) e inglés (`/en/`). El repo es público y es
portafolio: rendimiento, seguridad y calidad van en serio.

Prioridad: optimización primero, diseño después. Si el sitio corre lento en un celular de
gama baja o un notebook de 4 GB, no sirve.

## Forma de trabajar

### Ritmo
- Una tarea a la vez. Al terminarla, muestra el resultado y espera aprobación explícita.
- No te adelantes: un plan aprobado no aprueba el código, ni el texto del PR, ni el paso siguiente.
- Si algo grande no está claro, pregunta antes. Una duda menor que no cambia lo que se
  construye, decídela y cuéntala.
- Parte el trabajo grande en piezas chicas que se revisen de una vez.

### Quién decide
- Decide el usuario. Tú investigas, propones con fundamentos y recomiendas una opción.
- Investiga en fuentes primarias y vigentes (documentación oficial de la versión actual,
  changelogs, releases). Anota URL y fecha; marca lo no verificado.
- Entre varias formas válidas, elige la más estándar, simple y mantenible, y explica por qué.
- Prioridad: simplicidad, mantenibilidad, seguridad, automatización y, al final, velocidad.
- No cambies lo decidido. Si ves una mejora grande, detente y explica beneficios, costos y desventajas.

### Decisiones por escrito
- ADR en `docs/decisiones/NNNN-titulo.md` (MADR 4 recortado: Contexto, Opciones con
  contras, Decisión, Consecuencias, Confirmación) para lo difícil de revertir, lo que toca
  más de una pieza o lo que alguien cuestionará en seis meses.
- Nace `propuesta` y pasa a `aceptada` cuando el usuario confirma. Una aceptada no se
  reescribe: se reemplaza con una nueva.
- Alternativas reales, con contras. Si falta una obvia, va marcada "(no discutida)".
  Lo que no está claro queda como pregunta abierta.
- Requisitos en `docs/requisitos.md`; specs en `docs/specs/AAAA-MM-DD-tema.md`; planes en
  `docs/planes/AAAA-MM-DD-tema.md`. Estas rutas mandan sobre las de cualquier plugin o skill.
- Anota cada decisión del usuario apenas la toma.

### Entender antes de construir
- Primero qué y por qué; después cómo.
- Antes de cambiar algo, lee el código y los documentos que lo explican. No supongas que el
  estado sigue igual que en la sesión anterior.

### Listo significa evidencia
- Terminado significa mostrar el comando de verificación y su salida.
- Lo que no pudiste verificar se dice tal cual, con el motivo.
- Interfaz: recórrela con Playwright en móvil (360×800) y escritorio, en español e inglés.
  Muestra capturas del estado inicial, la interacción y el resultado en la sesión, no en el PR.

### Textos
- Español de Chile, tuteando ("puedes", "elige"). Nunca voseo.
- Términos técnicos en inglés cuando no tienen traducción natural (`deploy`, `endpoint`).
- Oraciones cortas, lo importante primero, sin relleno. Vale para documentos, commits, PRs,
  comentarios, la interfaz y los mensajes.
- Código, nombres y carpetas en inglés. Textos del sitio en español e inglés.

### Herramientas
- Crea y edita archivos con las herramientas de edición, no con scripts de shell.
- No salgas de la carpeta del proyecto ni toques otros repos.
- Lo que creas para probar queda versionado o documentado.
- Nada del proyecto depende de una persona, de su cuenta ni de su máquina.
- Instalar y actualizar lo hace el usuario: dale el comando listo con `!` adelante. Antes de
  proponer un paquete nuevo, justifica la necesidad, su última versión, la licencia
  (compatible con Apache-2.0) y si corre scripts de instalación.

### Continuidad
- Deja el estado al día: qué quedó a medias y el próximo paso concreto. Actualízalo antes
  de quedarte sin contexto.

## Git y PRs
- Nunca directo en `main`: rama `tipo/descripcion-corta` y PR. Merge solo squash.
- Conventional Commits: tipo en inglés y descripción en español, concisa
  (`feat: agregar galería base`). El título del PR va igual, porque con squash es el commit.
- Los commits hechos con la IA llevan el trailer `Co-Authored-By`.
- Push al final de la tarea, después de `pnpm check` completo.
- Muestra el título y el cuerpo del PR antes de crearlo. La sección "Prueba manual" la
  escribe el usuario.
- Con una revisión abierta, actualiza la rama con merge de `main`, no rebase.
- Una tarea es un PR revisable de una sentada (~400 líneas sin lockfile). Las tareas viven
  en GitHub Issues: Qué / Por qué / Listo cuando.
- Versiones: tag a mano en los hitos (`v1.0.0` = V1 completa) con un Release corto.

## Stack y comandos
- Astro 7 solo como generador de HTML: sin frameworks de UI ni `<ClientRouter />`.
- Node 26 LTS y pnpm 12, en versiones exactas en `package.json` (`packageManager`,
  `devEngines.runtime`).
- Dependencias en versión exacta, con al menos 7 días de publicadas (`minimumReleaseAge`).
  Scripts de instalación bloqueados, salvo una decisión explícita en `allowBuilds`.
  Un parche de seguridad de menos de 7 días va en `minimumReleaseAgeExclude`, con su
  versión exacta, en el mismo PR.
- `pnpm check:fast` (< 30 s): formato, tipos y unitarios. Córrelo después de cada cambio;
  el `pre-commit` lo exige.
- `pnpm check`: lo anterior más el build con las fotos reales, metadatos, HTML, enlaces,
  Playwright (Chromium, Firefox y WebKit) con axe, memoria, Lighthouse y REUSE. Es el mismo
  comando en local y en la CI; el `pre-push` lo exige.

## Reglas del sitio
- Presupuestos por página en la CI, con el perfil móvil de Lighthouse. Galería: 0 KB de JS,
  LCP ≤ 1,8 s, carga inicial ≤ 300 KB. Explicador: JS ≤ 5 KB. Un presupuesto solo cambia
  en un PR con su motivo. El presupuesto de JS también protege las zonas: el código del
  simulador (V2) solo carga en su página.
- Originales en `photos/originals/`, sin EXIF, GPS, XMP ni IPTC y con su ICC. Nunca se
  editan ni se vuelven a codificar.
- Las variantes las genera el script con sharp: AVIF + JPEG, 2048 px como máximo, sRGB y
  sin metadatos. `sizes` y `srcset` exactos, porque en una galería la RAM se va en píxeles
  decodificados.
- Contenido en YAML, validado con un esquema que hace fallar el build. Título y `alt`
  obligatorios en los dos idiomas.
- El CSP vive solo en `_headers`, sin nada inline: ni `<script>`, ni `style`, ni
  `define:vars`. Si algo necesita inline, es una decisión nueva.
- Explicador: SVG propio y CSS nativo, casi sin JS, sin 3D. Las mejoras progresivas
  (`@view-transition`, Speculation Rules) tienen que funcionar igual sin ellas.
- Licencias: código Apache-2.0; fotos, textos y SVG del explicador CC BY 4.0, con crédito
  a "clemgrass". Cada archivo nuevo queda cubierto por REUSE (cabecera SPDX o `REUSE.toml`).

## Testing
- TDD en los scripts: ve fallar el test por la razón correcta. El layout y el CSS no
  admiten TDD; se declara, y se cubren con pruebas en el navegador y capturas.
- Cada comportamiento nuevo lleva al menos un caso feliz, uno borde y uno negativo. Los
  nombres de los tests, en español, son los escenarios.
- Dobles en este orden: real, fake, stub y, al final, mock, solo de tipos propios. Un SDK de
  terceros se envuelve.
- Datos sintéticos y deterministas generados en el test; nunca datos personales.
- Cada bug parte con un test que lo reproduce.
- Un test inestable se reproduce y se arregla, sin esperas, reintentos ni `skip`. Un test
  que no se puede escribir se declara con `{ todo: 'motivo' }`.
- La cobertura es análisis, no meta.

## Despliegue
- `check` corre en cada PR y en `main`. `deploy` corre solo en push a `main`: publica el
  mismo `dist/` que pasó los checks, con 3 reintentos cada 2 minutos, corre el smoke y hace
  rollback automático si falla.
- La IA nunca despliega ni hace rollback.
