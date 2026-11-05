# Flyers de torneos de pádel

App web estática (HTML + CSS + JS, sin build ni dependencias) que genera **6 flyers distintos** de un torneo de pádel, en formato 4:5 (1080×1350 px), listos para compartir por WhatsApp.

## Modelos

| Modelo | Idea |
| --- | --- |
| **Banda** | Categoría gigante y fecha en una banda de color. |
| **Marcador** | Datos en una tabla estilo scoreboard. |
| **Pelota** | Composición centrada con la fecha dentro de una pelota. |
| **Afiche** | Bloque diagonal de color con el título. |
| **Ticket** | Entrada con muescas y línea de corte. |
| **Calendario** | Hoja de almanaque con el día en grande. |

## Personalización de los flyers

- **Tema:** oscuro o claro.
- **Paleta:** Cancha, Césped, Arcilla, Violeta, Rojo, Turquesa y Grafito.
- **Fondo:** Auto (cada modelo trae el suyo), Liso, Cancha, Rayas, Malla, Puntos o Círculos.

La elección se recuerda en el navegador.

## Campos

| Campo | Obligatorio |
| --- | --- |
| Complejo | Sí |
| Logo del complejo | No |
| Categorías (hasta 3 torneos en simultáneo) | Sí, al menos 1 |
| Fecha de inicio | Sí (hora opcional; igual para todas las categorías) |
| Fecha de fin | No (vacía = mismo día) |
| Inscripción ($) | No |
| Premio | No |
| Contactos (nombre + teléfono) | Sí, de 1 a 3 |

Todos los flyers muestran el nombre del complejo una sola vez y en grande, precedido por el logo (o por un pin de ubicación si no hay logo), y la nota "Inscripción abierta" antes de los contactos.

## Datos guardados en el navegador

La app recuerda automáticamente (localStorage) el **nombre del complejo**, el **logo** y los **contactos**, para no cargarlos en cada torneo. Categorías, fechas, inscripción y premio se cargan cada vez. También se recuerdan el tema, la paleta y el fondo elegidos.

- Se guarda por navegador y por dispositivo: no se comparte entre el celular y la compu.
- No persiste en ventanas privadas ni si se borran los datos del sitio.
- El botón "Borrar datos guardados" (abajo del formulario) elimina el complejo, el logo y los contactos.

## Compartir por WhatsApp

Debajo de cada flyer hay un botón de descarga y uno de WhatsApp. **Se comparte solo la imagen, sin texto.**

- **Celular:** abre el menú nativo de compartir con la imagen adjunta.
- **Escritorio:** descarga la imagen, la copia al portapapeles (si el navegador lo permite) y abre WhatsApp Web; en el chat se pega con Ctrl+V o se adjunta a mano.

> La Web Share API con archivos requiere HTTPS (GitHub Pages ya lo da).

## Publicar en GitHub Pages

El sitio se publica con GitHub Actions (`.github/workflows/deploy.yml`) para poder estampar la versión en cada deploy.

1. Subí los archivos a la raíz del repo (rama `main`).
2. En **Settings → Pages → Build and deployment → Source**, elegí **GitHub Actions** (una sola vez).
3. En cada push a `main` se publica solo. La app queda en `https://<usuario>.github.io/<repo>/`.

## Versión y aviso de actualización

- La versión se sube **a mano** en `version.json` (`"version": "1.1.0"`) cuando hay cambios visibles para los usuarios. Se ve en el pie de página (`v1.0.0`; pasando el mouse, el build y la fecha).
- En cada deploy, el workflow genera `version.json` y `version.js` con el **build** (commit corto) y la fecha. La app consulta `version.json` cada 5 minutos y al volver a la pestaña: si el build publicado es distinto del que está corriendo, muestra el cartel **"Hay una versión nueva · Actualizar"** (con "Más tarde" para ocultarlo hasta la próxima versión).
- El cartel sale en cada deploy aunque no se cambie `version`; conviene subirla cuando hay cambios para que el usuario vea el número.
- "Actualizar" recarga con `?v=<build>` para saltear la caché de GitHub Pages. Los archivos se cargan con `?v=<build>`, así que nadie queda con un `app.js` viejo.
- Los datos que la app no guarda sola (categorías, fechas, inscripción, premio) se pierden al actualizar; el cartel lo avisa.
- Local (sin Actions): `version.js` y `version.json` quedan con build `dev` y el cartel nunca aparece.

## Estructura

```
index.html   Formulario y contenedores
styles.css   Estilos de la app (colores del sitio de proyectos)
app.js       Validación, dibujo en canvas de cada modelo, compartir/descargar, aviso de versión
version.js   Versión que está corriendo (la regenera el deploy)
version.json Versión publicada (la sube a mano; el build lo pone el deploy)
.github/workflows/deploy.yml   Deploy a GitHub Pages con versión y build
```

## Personalizar

- **Paletas:** arreglo `PALETTES` al inicio de `app.js`.
- **Fondos:** función `drawPattern`.
- **Nuevo modelo:** crear `tplXxx(ctx, data, theme, pattern)` y registrarlo en `TEMPLATES`.
- **Tema de la app:** comparte la clave `theme` de localStorage con https://federicoolego.github.io/federicoolego-/
