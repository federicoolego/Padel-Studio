# Flyers de torneos de pádel

App web estática (HTML + CSS + JS, sin build ni dependencias) que genera **3 flyers distintos** de un torneo de pádel, en formato 4:5 (1080×1350 px), listos para compartir por WhatsApp.

## Modelos

| Modelo | Idea |
| --- | --- |
| **Cancha** | Líneas de cancha de fondo, categoría gigante y fecha en una banda de color. |
| **Marcador** | Datos en una tabla estilo scoreboard. |
| **Pelota** | Composición centrada con la fecha dentro de una pelota. |

Cada flyer se ve en tema **oscuro** o **claro** (selector arriba de los flyers).

## Campos

| Campo | Obligatorio |
| --- | --- |
| Complejo | Sí |
| Logo del complejo | No |
| Categoría (ej: Suma 10 Caballeros) | Sí |
| Fecha de inicio | Sí (hora opcional) |
| Fecha de fin | No (vacía = mismo día) |
| Inscripción ($) | No |
| Premio | No |
| Contactos (nombre + teléfono) | Sí, de 1 a 3 |

Los flyers aparecen cuando están completos los campos obligatorios; hasta entonces la app lista lo que falta.

## Compartir por WhatsApp

Cada flyer tiene un botón verde de WhatsApp y uno de descarga.

- **Celular:** abre el menú nativo de compartir con la imagen y un texto armado (categoría, fecha, inscripción, premio y contactos). Elegís WhatsApp y el chat.
- **Escritorio:** descarga la imagen y abre WhatsApp Web con el texto listo; la imagen se adjunta a mano.

> La Web Share API con archivos requiere HTTPS (GitHub Pages ya lo da).

## Publicar en GitHub Pages

1. Subí estos archivos a la raíz del repo (rama `main`).
2. En **Settings → Pages**, elegí *Deploy from a branch* → `main` → `/ (root)`.
3. La app queda en `https://<usuario>.github.io/<repo>/`.

Para probarla en local alcanza con abrir `index.html` (las tipografías de Google Fonts necesitan internet; sin conexión se usan tipografías del sistema).

## Estructura

```
index.html   Formulario y contenedores de los 3 flyers
styles.css   Estilos de la interfaz (claro/oscuro según el sistema)
app.js       Validación, dibujo en canvas de cada modelo, compartir/descargar
```

## Personalizar

- **Colores de los flyers:** objeto `THEMES` al inicio de `app.js` (`dark` y `light`).
- **Tipografías:** constantes `DISPLAY` y `TEXT` en `app.js` y el `<link>` de Google Fonts en `index.html`.
- **Nuevo modelo:** crear una función `tplXxx(ctx, data, theme)`, registrarla en `TEMPLATES` y agregar un `<figure class="flyer" data-template="xxx">` en `index.html`.
