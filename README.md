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
| Categoría | Sí |
| Fecha de inicio | Sí (hora opcional) |
| Fecha de fin | No (vacía = mismo día) |
| Inscripción ($) | No |
| Premio | No |
| Contactos (nombre + teléfono) | Sí, de 1 a 3 |

En todos los flyers se muestra un pin de ubicación con "Dirección:" y el nombre del complejo.

## Compartir por WhatsApp

Debajo de cada flyer hay un botón de descarga y uno de WhatsApp.

- **Celular:** abre el menú nativo de compartir con la imagen y un texto armado (categoría, fecha, dirección, inscripción, premio y contactos).
- **Escritorio:** descarga la imagen y abre WhatsApp Web con el texto listo; la imagen se adjunta a mano.

> La Web Share API con archivos requiere HTTPS (GitHub Pages ya lo da).

## Publicar en GitHub Pages

1. Subí estos archivos a la raíz del repo (rama `main`).
2. En **Settings → Pages**, elegí *Deploy from a branch* → `main` → `/ (root)`.
3. La app queda en `https://<usuario>.github.io/<repo>/`.

## Estructura

```
index.html   Formulario y contenedores
styles.css   Estilos de la app (colores del sitio de proyectos)
app.js       Validación, dibujo en canvas de cada modelo, compartir/descargar
```

## Personalizar

- **Paletas:** arreglo `PALETTES` al inicio de `app.js`.
- **Fondos:** función `drawPattern`.
- **Nuevo modelo:** crear `tplXxx(ctx, data, theme, pattern)` y registrarlo en `TEMPLATES`.
- **Tema de la app:** comparte la clave `theme` de localStorage con https://federicoolego.github.io/federicoolego-/
