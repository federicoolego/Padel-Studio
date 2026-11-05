(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  Constantes
   * ------------------------------------------------------------------ */
  const W = 1080;           // ancho del flyer (px)
  const H = 1350;           // alto del flyer (px) -> 4:5, ideal para WhatsApp
  const M = 72;             // margen
  const BALL = '#D8EE3A';   // color de la pelota (siempre amarillo-verdoso)

  const DISPLAY = '"Big Shoulders Display","Arial Narrow",Impact,sans-serif';
  const TEXT = 'Figtree,system-ui,-apple-system,"Segoe UI",sans-serif';

  // Paletas: deep = fondo oscuro / texto en tema claro, primary = acento en tema claro,
  // hi = acento en tema oscuro. Para agregar una, sumá un objeto acá.
  const PALETTES = [
    { id: 'cancha',   name: 'Cancha',   deep: '#0E2750', primary: '#1B5FD1', hi: '#D8EE3A' },
    { id: 'cesped',   name: 'Césped',   deep: '#0B3D2E', primary: '#1E9E62', hi: '#F4E94A' },
    { id: 'arcilla',  name: 'Arcilla',  deep: '#4A1C10', primary: '#D4532B', hi: '#FFD27A' },
    { id: 'violeta',  name: 'Violeta',  deep: '#26124D', primary: '#7C3AED', hi: '#E4F24A' },
    { id: 'rojo',     name: 'Rojo',     deep: '#3A0C17', primary: '#D62839', hi: '#FFC857' },
    { id: 'turquesa', name: 'Turquesa', deep: '#07343B', primary: '#0E8C99', hi: '#7CF0E0' },
    { id: 'grafito',  name: 'Grafito',  deep: '#0D1117', primary: '#16A34A', hi: '#4ADE80' }
  ];

  const PATTERNS = [
    { id: 'auto',      name: 'Auto' },
    { id: 'liso',      name: 'Liso' },
    { id: 'cancha',    name: 'Cancha' },
    { id: 'diagonales', name: 'Rayas' },
    { id: 'malla',     name: 'Malla' },
    { id: 'puntos',    name: 'Puntos' },
    { id: 'circulos',  name: 'Círculos' }
  ];

  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MESES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* ------------------------------------------------------------------ *
   *  Colores
   * ------------------------------------------------------------------ */
  const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgb2hex = a => '#' + a.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, p) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, i) => v * (1 - p) + B[i] * p)); };
  const rgba = (h, a) => { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; };

  function buildTheme(p, mode) {
    if (mode === 'dark') {
      const dark = mix(p.deep, '#000000', 0.2);
      return {
        bg: p.deep, bg2: mix(p.deep, '#000000', 0.35), panel: mix(p.deep, '#ffffff', 0.1),
        ink: '#FFFFFF', muted: mix(p.deep, '#ffffff', 0.68), line: 'rgba(255,255,255,.17)',
        accent: p.hi, onAccent: dark, ball: BALL, onBall: dark
      };
    }
    return {
      bg: mix(p.deep, '#ffffff', 0.94), bg2: mix(p.deep, '#ffffff', 0.86), panel: '#FFFFFF',
      ink: p.deep, muted: mix(p.deep, '#ffffff', 0.35), line: rgba(p.deep, 0.17),
      accent: p.primary, onAccent: '#FFFFFF', ball: BALL, onBall: p.deep
    };
  }

  /* ------------------------------------------------------------------ *
   *  Estado y DOM
   * ------------------------------------------------------------------ */
  const state = { theme: 'dark', palette: 'cancha', pattern: 'auto', logo: null, logoData: null, blobs: {} };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const form = $('#form');
  const contactsEl = $('#contacts');
  const addContactBtn = $('#add-contact');
  const categoriasEl = $('#categorias');
  const addCategoriaBtn = $('#add-categoria');
  const logoInput = $('#logo');
  const logoChip = $('#logo-chip');
  const logoPreview = $('#logo-preview');
  const gallery = $('#gallery');
  const emptyEl = $('#empty');
  const missingEl = $('#missing');
  const toastEl = $('#toast');

  const getPalette = () => PALETTES.find(p => p.id === state.palette) || PALETTES[0];
  const getTheme = () => buildTheme(getPalette(), state.theme);

  const fontsReady = Promise.all([
    document.fonts.load('900 80px "Big Shoulders Display"'),
    document.fonts.load('800 80px "Big Shoulders Display"'),
    document.fonts.load('600 30px Figtree'),
    document.fonts.load('700 30px Figtree')
  ]).catch(() => {});

  /* ------------------------------------------------------------------ *
   *  Contactos (hasta 3)
   * ------------------------------------------------------------------ */
  function addContact() {
    if (contactsEl.children.length >= 3) return;
    const row = document.createElement('div');
    row.className = 'contact-row';
    row.innerHTML =
      '<input type="text" name="cNombre" maxlength="30" placeholder="Nombre del contacto">' +
      '<input type="tel" name="cTel" maxlength="22" placeholder="Teléfono del contacto" inputmode="tel">' +
      '<button type="button" class="rm" aria-label="Quitar contacto">×</button>';
    row.querySelector('.rm').addEventListener('click', () => {
      row.remove();
      refreshContacts();
      schedule();
    });
    contactsEl.appendChild(row);
    refreshContacts();
  }

  function refreshContacts() {
    [...contactsEl.children].forEach((row, i) => {
      row.querySelector('[name=cNombre]').setAttribute('aria-label', `Nombre del contacto ${i + 1}`);
      row.querySelector('[name=cTel]').setAttribute('aria-label', `Teléfono del contacto ${i + 1}`);
      const rm = row.querySelector('.rm');
      rm.classList.toggle('placeholder', i === 0);
      rm.tabIndex = i === 0 ? -1 : 0;
    });
    addContactBtn.disabled = contactsEl.children.length >= 3;
  }

  /* ------------------------------------------------------------------ *
   *  Categorías (hasta 3 torneos en simultáneo)
   * ------------------------------------------------------------------ */
  function addCategoria() {
    if (categoriasEl.children.length >= 3) return;
    const row = document.createElement('div');
    row.className = 'cat-row';
    row.innerHTML =
      '<input type="text" name="cat" maxlength="40" placeholder="Categoría del torneo">' +
      '<button type="button" class="rm" aria-label="Quitar categoría">×</button>';
    row.querySelector('.rm').addEventListener('click', () => {
      row.remove();
      refreshCategorias();
      schedule();
    });
    categoriasEl.appendChild(row);
    refreshCategorias();
  }

  function refreshCategorias() {
    [...categoriasEl.children].forEach((row, i) => {
      row.querySelector('[name=cat]').setAttribute('aria-label', `Categoría ${i + 1}`);
      const rm = row.querySelector('.rm');
      rm.classList.toggle('placeholder', i === 0);
      rm.tabIndex = i === 0 ? -1 : 0;
    });
    addCategoriaBtn.disabled = categoriasEl.children.length >= 3;
  }

  /* ------------------------------------------------------------------ *
   *  Lectura y validación de datos
   * ------------------------------------------------------------------ */
  function readData() {
    const v = n => form.elements[n].value.trim();
    const rows = [...contactsEl.children].map(r => ({
      nombre: r.querySelector('[name=cNombre]').value.trim(),
      tel: r.querySelector('[name=cTel]').value.trim()
    }));
    const completos = rows.filter(c => c.nombre && c.tel);
    const parciales = rows.filter(c => (c.nombre || c.tel) && !(c.nombre && c.tel));

    const categorias = [...categoriasEl.querySelectorAll('[name=cat]')].map(i => i.value.trim()).filter(Boolean);
    const digits = v('inscripcion').replace(/\D/g, '');
    const data = {
      complejo: v('complejo'),
      logo: state.logo,
      categorias,
      torneoLabel: categorias.length > 1 ? 'Torneos de pádel' : 'Torneo de pádel',
      inicio: v('inicio'),
      hora: v('hora'),
      fin: v('fin'),
      inscripcion: digits ? '$' + digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '',
      premio: v('premio'),
      contactos: completos
    };

    const missing = [];
    if (!data.complejo) missing.push('Nombre del complejo');
    if (!categorias.length) missing.push('Categoría del torneo');
    if (!data.inicio) missing.push('Fecha de inicio');
    if (data.inicio && data.fin && data.fin < data.inicio) missing.push('La fecha de fin no puede ser anterior a la de inicio');
    if (!completos.length) missing.push('Al menos un contacto con nombre y teléfono');
    else if (parciales.length) missing.push('Completá nombre y teléfono en cada contacto (o quitalo)');
    return { data, missing };
  }

  /* ------------------------------------------------------------------ *
   *  Fechas
   * ------------------------------------------------------------------ */
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const isRange = (s, e) => e && e.getTime() !== s.getTime();

  function dateInfo(d) {
    const s = parseDate(d.inicio);
    const e = d.fin ? parseDate(d.fin) : null;
    const hora = d.hora ? `${d.hora} hs` : '';
    if (!isRange(s, e)) {
      const dia = cap(DIAS[s.getDay()]);
      return {
        big: `${s.getDate()} ${MESES_C[s.getMonth()]}`.toUpperCase(),
        small: [dia, hora].filter(Boolean).join(' · '),
        label: dia, hora
      };
    }
    const same = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    const big = (same
      ? `${s.getDate()} al ${e.getDate()} ${MESES_C[e.getMonth()]}`
      : `${s.getDate()} ${MESES_C[s.getMonth()]} al ${e.getDate()} ${MESES_C[e.getMonth()]}`).toUpperCase();
    const dias = `${cap(DIAS[s.getDay()])} a ${DIAS[e.getDay()]}`;
    return {
      big,
      small: [dias, hora ? `Inicio ${hora}` : ''].filter(Boolean).join(' · '),
      label: 'Fechas', hora
    };
  }

  // Datos para el modelo "Calendario"
  function calInfo(d) {
    const s = parseDate(d.inicio);
    const e = d.fin ? parseDate(d.fin) : null;
    if (!isRange(s, e)) {
      return { month: MESES[s.getMonth()].toUpperCase(), days: String(s.getDate()), dia: cap(DIAS[s.getDay()]) };
    }
    const same = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    return {
      month: same ? MESES[s.getMonth()].toUpperCase() : `${MESES_C[s.getMonth()]} - ${MESES_C[e.getMonth()]}`.toUpperCase(),
      days: `${s.getDate()}-${e.getDate()}`,
      dia: `${cap(DIAS[s.getDay()])} a ${DIAS[e.getDay()]}`
    };
  }

  /* ------------------------------------------------------------------ *
   *  Helpers de dibujo
   * ------------------------------------------------------------------ */
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Fondos decorativos. k = factor de grosor (para miniaturas).
  function drawPattern(ctx, t, kind, k = 1) {
    if (!kind || kind === 'liso') return;
    ctx.save();
    ctx.strokeStyle = t.line;
    ctx.fillStyle = t.line;
    ctx.setLineDash([]);

    if (kind === 'cancha') {
      const mid = H / 2;
      ctx.lineWidth = 4 * k;
      ctx.strokeRect(40, 40, W - 80, H - 80);
      ctx.beginPath();
      ctx.moveTo(40, mid - 440); ctx.lineTo(W - 40, mid - 440);
      ctx.moveTo(40, mid + 440); ctx.lineTo(W - 40, mid + 440);
      ctx.moveTo(W / 2, mid - 440); ctx.lineTo(W / 2, mid + 440);
      ctx.stroke();
      ctx.lineWidth = 8 * k;
      ctx.setLineDash([16, 12]);
      ctx.beginPath();
      ctx.moveTo(40, mid); ctx.lineTo(W - 40, mid);
      ctx.stroke();
    } else if (kind === 'diagonales') {
      ctx.lineWidth = 3 * k;
      for (let i = -H; i < W; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, H); ctx.lineTo(i + H, 0);
        ctx.stroke();
      }
    } else if (kind === 'malla') {
      // Malla de las paredes de una cancha de pádel
      ctx.lineWidth = 2 * k;
      for (let i = -H; i < W; i += 72) {
        ctx.beginPath();
        ctx.moveTo(i, H); ctx.lineTo(i + H, 0);
        ctx.moveTo(i, 0); ctx.lineTo(i + H, H);
        ctx.stroke();
      }
    } else if (kind === 'puntos') {
      for (let y = 40; y < H; y += 54) {
        for (let x = 40; x < W; x += 54) {
          ctx.beginPath();
          ctx.arc(x, y, 3.5 * k, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (kind === 'circulos') {
      ctx.lineWidth = 3 * k;
      for (let r = 140; r < 2000; r += 110) {
        ctx.beginPath();
        ctx.arc(W, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function bgFill(ctx, t, pattern, k = 1) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, t.bg);
    g.addColorStop(1, t.bg2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    drawPattern(ctx, t, pattern, k);
  }

  // Parte el texto en líneas (con ctx.font ya definido). Si excede maxLines, corta con "…".
  function wrapLines(ctx, text, maxW, maxLines) {
    const words = text.split(/\s+/).filter(Boolean);
    const out = [];
    let cur = '';
    for (const w of words) {
      const tt = cur ? cur + ' ' + w : w;
      if (cur && ctx.measureText(tt).width > maxW) { out.push(cur); cur = w; } else { cur = tt; }
    }
    if (cur) out.push(cur);
    if (maxLines && out.length > maxLines) {
      const keep = out.slice(0, maxLines - 1);
      let last = out.slice(maxLines - 1).join(' ');
      while (last.length > 1 && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
      keep.push(last + '…');
      return keep;
    }
    return out;
  }

  // Achica la fuente hasta que el texto entre en una línea. Deja ctx.font configurado.
  function fitLine(ctx, text, maxW, size, min, weight, family) {
    for (; size > min; size -= 2) {
      ctx.font = `${weight} ${size}px ${family}`;
      if (ctx.measureText(text).width <= maxW) return size;
    }
    ctx.font = `${weight} ${min}px ${family}`;
    return min;
  }

  function layoutHeadline(ctx, input, { maxW, max, min, lines = 2, maxH = 0, weight = 900 }) {
    const list = Array.isArray(input) ? input : [input];

    // Varias categorías: una por línea, todas del mismo tamaño.
    if (list.length > 1) {
      const items = list.map(x => x.toUpperCase());
      let size = Math.min(max, 150);
      for (;;) {
        ctx.font = `${weight} ${size}px ${DISPLAY}`;
        const wide = items.every(l => ctx.measureText(l).width <= maxW);
        const h = size * 0.78 + (items.length - 1) * size * 0.98;
        if ((wide && (!maxH || h <= maxH)) || size <= 40) break;
        size -= 4;
      }
      const lh = size * 0.98;
      return { ls: items, size, lh, weight, height: size * 0.78 + (items.length - 1) * lh };
    }

    const up = list[0].toUpperCase();
    let size = max;
    let ls;
    for (;;) {
      ctx.font = `${weight} ${size}px ${DISPLAY}`;
      ls = wrapLines(ctx, up, maxW);
      const h = size * 0.78 + (Math.max(ls.length, 1) - 1) * size * 0.9;
      const ok = ls.length <= lines && ls.every(l => ctx.measureText(l).width <= maxW) && (!maxH || h <= maxH);
      if (ok || size <= min) break;
      size -= 4;
    }
    if (ls.length > lines) ls = wrapLines(ctx, up, maxW, lines);
    const lh = size * 0.9;
    return { ls, size, lh, weight, height: size * 0.78 + (ls.length - 1) * lh };
  }

  // Dibuja el titular con su borde superior en y. Devuelve el y inferior.
  function drawHeadline(ctx, L, x, y, align, color) {
    ctx.font = `${L.weight} ${L.size}px ${DISPLAY}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    L.ls.forEach((l, i) => ctx.fillText(l, x, y + L.size * 0.78 + i * L.lh));
    return y + L.height;
  }

  function drawLogo(ctx, img, cx, cy, d, t) {
    const r = d / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.clip();
    const inner = d * 0.7;
    const iw = img.naturalWidth || img.width || inner;
    const ih = img.naturalHeight || img.height || inner;
    const s = Math.min(inner / iw, inner / ih);
    ctx.drawImage(img, cx - (iw * s) / 2, cy - (ih * s) / 2, iw * s, ih * s);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = t.line;
    ctx.stroke();
  }

  // Ajusta el nombre del complejo: hasta 2 líneas, lo más grande posible.
  function fitName(ctx, name, maxW, size) {
    let s = size, lines;
    for (;;) {
      ctx.font = `700 ${s}px ${TEXT}`;
      lines = wrapLines(ctx, name, maxW);
      if ((lines.length <= 2 && lines.every(l => ctx.measureText(l).width <= maxW)) || s <= 36) break;
      s -= 2;
    }
    if (lines.length > 2) lines = wrapLines(ctx, name, maxW, 2);
    return { lines, size: s, lh: s * 1.12 };
  }

  // Encabezado: logo (o pin de ubicación) + nombre del complejo, una sola vez y en grande.
  function header(ctx, d, t, cy, size, color, nameSize = 72, pinColor) {
    let tx = M;
    if (d.logo) {
      drawLogo(ctx, d.logo, M + size / 2, cy, size, t);
      tx = M + size + 28;
    } else {
      const ph = nameSize * 0.95;
      drawPin(ctx, M, cy - ph / 2, ph, pinColor || t.accent);
      tx = M + ph * 0.7 + 20;
    }
    const N = fitName(ctx, d.complejo, W - M - tx, nameSize);
    ctx.fillStyle = color || t.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const top = cy - (N.lines.length * N.lh) / 2;
    N.lines.forEach((l, i) => ctx.fillText(l, tx, top + i * N.lh + N.size * 0.82));
  }

  // Igual que header, pero centrado. Devuelve el y inferior.
  function centerName(ctx, d, t, { cx, y, maxW, nameSize, logoSize }) {
    if (d.logo) {
      drawLogo(ctx, d.logo, cx, y + logoSize / 2, logoSize, t);
      y += logoSize + 20;
    } else {
      const ph = nameSize * 0.9;
      drawPin(ctx, cx - ph * 0.35, y, ph, t.accent);
      y += ph + 12;
    }
    const N = fitName(ctx, d.complejo, maxW, nameSize);
    ctx.fillStyle = t.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    N.lines.forEach((l, i) => ctx.fillText(l, cx, y + N.size * 0.82 + i * N.lh));
    return y + N.lines.length * N.lh;
  }

  function pill(ctx, t, text, x, y, align) {
    ctx.font = `700 30px ${TEXT}`;
    const w = ctx.measureText(text).width + 80;
    const h = 56;
    const px = align === 'center' ? x - w / 2 : x;
    roundRect(ctx, px, y, w, h, 28);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = t.line;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px + 32, y + h / 2, 9, 0, Math.PI * 2);
    ctx.fillStyle = t.ball;
    ctx.fill();
    ctx.fillStyle = t.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, px + 54, y + 37);
    return y + h;
  }

  // Ícono de ubicación (pin)
  const PIN = new Path2D('M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z');
  function drawPin(ctx, x, y, h, color) {
    const s = h / 20;
    ctx.save();
    ctx.translate(x - 5 * s, y - 2 * s);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    ctx.fill(PIN, 'evenodd');
    ctx.restore();
  }

  // Nota "Inscripción abierta" con línea a los costados. y = borde superior (alto 46).
  function drawNote(ctx, t, { y, align = 'left', x0 = M, x1 = W - M }) {
    const text = 'Inscripción abierta';
    ctx.font = `700 30px ${TEXT}`;
    const w = ctx.measureText(text).width + 76;
    const h = 46;
    const px = align === 'center' ? (x0 + x1) / 2 - w / 2 : x0;
    ctx.save();
    ctx.strokeStyle = t.line;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (align === 'center') {
      ctx.moveTo(x0, y + h / 2); ctx.lineTo(px - 20, y + h / 2);
    }
    ctx.moveTo(px + w + 20, y + h / 2); ctx.lineTo(x1, y + h / 2);
    ctx.stroke();
    ctx.restore();
    roundRect(ctx, px, y, w, h, 23);
    ctx.fillStyle = t.accent;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 30, y + h / 2, 8, 0, Math.PI * 2);
    ctx.fillStyle = t.onAccent;
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, px + 48, y + h / 2 + 10);
  }

  // Inscripción y premio en columnas. y = línea base de las etiquetas.
  function infoCols(ctx, t, d, { x, w, y, align = 'left', priceSize = 88 }) {
    const items = [];
    if (d.inscripcion) items.push({ label: 'Inscripción', value: d.inscripcion, price: true });
    if (d.premio) items.push({ label: 'Premio', value: d.premio });
    if (!items.length) return;
    const gap = 40;
    const cw = (w - gap * (items.length - 1)) / items.length;
    items.forEach((it, i) => {
      const cx0 = x + i * (cw + gap);
      const ax = align === 'center' ? cx0 + cw / 2 : cx0;
      ctx.textAlign = align;
      ctx.textBaseline = 'alphabetic';
      ctx.font = `600 28px ${TEXT}`;
      ctx.fillStyle = t.muted;
      ctx.fillText(it.label, ax, y);
      ctx.fillStyle = t.ink;
      if (it.price) {
        const s = fitLine(ctx, it.value, cw, priceSize, 40, 800, DISPLAY);
        ctx.fillText(it.value, ax, y + 18 + s * 0.78);
      } else {
        ctx.font = `700 36px ${TEXT}`;
        wrapLines(ctx, it.value, cw, 2).forEach((l, k) => ctx.fillText(l, ax, y + 48 + k * 44));
      }
    });
  }

  // Contactos en columnas (1 a 3). Alto aproximado: 100 px.
  function drawContacts(ctx, t, contactos, { x, y, w, align = 'left' }) {
    const n = contactos.length;
    const gap = 24;
    const cw = (w - gap * (n - 1)) / n;
    contactos.forEach((c, i) => {
      const cx = align === 'center' ? x + i * (cw + gap) + cw / 2 : x + i * (cw + gap);
      ctx.textAlign = align;
      ctx.textBaseline = 'alphabetic';
      fitLine(ctx, c.nombre, cw, 34, 22, 700, TEXT);
      ctx.fillStyle = t.muted;
      ctx.fillText(c.nombre, cx, y + 32);
      fitLine(ctx, c.tel, cw, 58, 28, 800, DISPLAY);
      ctx.fillStyle = t.ink;
      ctx.fillText(c.tel, cx, y + 92);
    });
  }

  function drawBall(ctx, t, cx, cy, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = t.ball;
    ctx.fill();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.lineWidth = Math.max(8, r * 0.05);
    ctx.beginPath();
    ctx.arc(cx - r * 1.3, cy, r * 1.0, -1.0, 1.0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + r * 1.3, cy, r * 1.0, Math.PI - 1.0, Math.PI + 1.0);
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = t.line;
    ctx.stroke();
  }

  /* ------------------------------------------------------------------ *
   *  Modelo 1: Banda — categoría gigante y fecha en una banda de color
   * ------------------------------------------------------------------ */
  function tplBanda(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);
    header(ctx, d, t, 150, 120, null, 72);
    pill(ctx, t, d.torneoLabel, M, 290, 'left');

    const L = layoutHeadline(ctx, d.categorias, { maxW: W - 2 * M, max: 210, min: 100, maxH: 270 });
    const blockH = L.height + 40 + 14;
    const top = 370 + (330 - blockH) / 2;
    const bottom = drawHeadline(ctx, L, M, top, 'left', t.ink);
    roundRect(ctx, M, bottom + 40, 170, 14, 7);
    ctx.fillStyle = t.accent;
    ctx.fill();

    // Banda de fecha
    const info = dateInfo(d);
    const bandY = 735, bandH = 175;
    roundRect(ctx, M, bandY, W - 2 * M, bandH, 28);
    ctx.fillStyle = t.accent;
    ctx.fill();
    const bigSize = fitLine(ctx, info.big, W - 2 * M - 80, 130, 50, 900, DISPLAY);
    const smallH = info.small ? 18 + 26 : 0;
    const contentH = bigSize * 0.78 + smallH;
    const by = bandY + (bandH - contentH) / 2 + bigSize * 0.78;
    ctx.fillStyle = t.onAccent;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(info.big, M + 40, by);
    if (info.small) {
      ctx.font = `700 34px ${TEXT}`;
      ctx.fillText(info.small, M + 40, by + 18 + 28);
    }

    infoCols(ctx, t, d, { x: M, w: W - 2 * M, y: 1006, priceSize: 88 });

    drawNote(ctx, t, { y: 1136 });
    drawContacts(ctx, t, d.contactos, { x: M, y: 1202, w: W - 2 * M });
  }

  /* ------------------------------------------------------------------ *
   *  Modelo 2: Marcador — tabla estilo scoreboard
   * ------------------------------------------------------------------ */
  function tplMarcador(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);

    ctx.fillStyle = t.bg2;
    ctx.fillRect(0, 0, W, 200);
    ctx.fillStyle = t.accent;
    ctx.fillRect(0, 200, W, 8);
    header(ctx, d, t, 102, 112, null, 58);

    let y = pill(ctx, t, d.torneoLabel, M, 250, 'left');
    const L = layoutHeadline(ctx, d.categorias, { maxW: W - 2 * M, max: 170, min: 90, maxH: 260 });
    y = drawHeadline(ctx, L, M, y + 34, 'left', t.ink);

    const info = dateInfo(d);
    const rows = [{ label: info.label, value: info.big, w: 1 }];
    if (info.hora) rows.push({ label: 'Hora', value: info.hora, w: 1 });
    if (d.inscripcion) rows.push({ label: 'Inscripción', value: d.inscripcion, w: 1 });
    if (d.premio) rows.push({ label: 'Premio', value: d.premio, w: 1.5, wrap: true });

    const footTop = 1110;
    const tableTop = y + 50;
    const avail = footTop - 40 - tableTop;
    const totalW = rows.reduce((a, r) => a + r.w, 0);
    const unit = Math.min(150, avail / totalW);
    const tableH = unit * totalW;
    const labelW = 300;

    ctx.save();
    roundRect(ctx, M, tableTop, W - 2 * M, tableH, 26);
    ctx.clip();
    let ry = tableTop;
    rows.forEach((r, i) => {
      const h = unit * r.w;
      ctx.fillStyle = t.accent;
      ctx.fillRect(M, ry, labelW, h);
      ctx.fillStyle = t.panel;
      ctx.fillRect(M + labelW, ry, W - 2 * M - labelW, h);

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      let lx = M + 28;
      let lmax = labelW - 56;
      if (r.pin) {
        const ph = Math.min(40, h * 0.5);
        drawPin(ctx, lx, ry + h / 2 - ph / 2, ph, t.onAccent);
        lx += ph * 0.7 + 12;
        lmax -= ph * 0.7 + 12;
      }
      fitLine(ctx, r.label.toUpperCase(), lmax, Math.min(46, h * 0.5), 18, 800, DISPLAY);
      ctx.fillStyle = t.onAccent;
      ctx.fillText(r.label.toUpperCase(), lx, ry + h / 2 + 2);

      const vx = M + labelW + 36;
      const vw = W - 2 * M - labelW - 72;
      ctx.fillStyle = t.ink;
      if (r.wrap) {
        const fs = Math.max(24, Math.min(40, h * 0.3));
        ctx.font = `700 ${fs}px ${TEXT}`;
        const ls = wrapLines(ctx, r.value, vw, 2);
        const lh = fs * 1.25;
        ls.forEach((l, k) => ctx.fillText(l, vx, ry + h / 2 - (ls.length * lh) / 2 + lh / 2 + k * lh));
      } else {
        fitLine(ctx, r.value, vw, Math.min(92, h * 0.72), 26, 800, DISPLAY);
        ctx.fillText(r.value, vx, ry + h / 2 + 2);
      }
      if (i > 0) {
        ctx.fillStyle = t.bg;
        ctx.fillRect(M, ry, W - 2 * M, 4);
      }
      ry += h;
    });
    ctx.restore();

    ctx.fillStyle = t.bg2;
    ctx.fillRect(0, footTop, W, H - footTop);
    ctx.fillStyle = t.accent;
    ctx.fillRect(0, footTop, W, 8);
    drawNote(ctx, t, { y: 1130 });
    drawContacts(ctx, t, d.contactos, { x: M, y: 1200, w: W - 2 * M });
  }

  /* ------------------------------------------------------------------ *
   *  Modelo 3: Pelota — la fecha dentro de una pelota, composición centrada
   * ------------------------------------------------------------------ */
  function tplPelota(ctx, d, t, pattern) {
    const g = ctx.createRadialGradient(W / 2, H * 0.55, 60, W / 2, H * 0.55, 960);
    g.addColorStop(0, t.panel);
    g.addColorStop(1, t.bg);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    drawPattern(ctx, t, pattern);

    let y = centerName(ctx, d, t, { cx: W / 2, y: 56, maxW: W - 2 * M, nameSize: 66, logoSize: 100 }) + 8;

    ctx.font = `600 32px ${TEXT}`;
    ctx.fillStyle = t.muted;
    ctx.fillText(d.torneoLabel, W / 2, y + 28);
    y += 42;

    const L = layoutHeadline(ctx, d.categorias, { maxW: W - 2 * M, max: 200, min: 90, maxH: 300 });
    y = drawHeadline(ctx, L, W / 2, y, 'center', t.ink) + 44;

    // Alto del bloque inscripción / premio / dirección
    let premioLines = [];
    let infoH = 0;
    if (d.inscripcion) infoH += 72;
    if (d.premio) {
      ctx.font = `600 34px ${TEXT}`;
      premioLines = wrapLines(ctx, 'Premio: ' + d.premio, W - 2 * M - 80, 2);
      infoH += (infoH ? 10 : 0) + premioLines.length * 42;
    }
    
    const contactsTop = 1194;
    const noteTop = contactsTop - 58;
    const spaceBottom = noteTop - 22 - infoH - 24;
    const R = Math.max(110, Math.min(240, (spaceBottom - y) / 2));
    const cy = y + R;
    drawBall(ctx, t, W / 2, cy, R);

    const info = dateInfo(d);
    const bigSize = fitLine(ctx, info.big, R * 2 * 0.8, Math.round(R * 0.62), 34, 900, DISPLAY);
    const smallSize = Math.max(20, Math.round(R * 0.14));
    const smallH = info.small ? 14 + smallSize * 0.8 : 0;
    const contentH = bigSize * 0.78 + smallH;
    const baseY = cy - contentH / 2 + bigSize * 0.78;
    ctx.fillStyle = t.onBall;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(info.big, W / 2, baseY);
    if (info.small) {
      fitLine(ctx, info.small, R * 2 * 0.8, smallSize, 14, 700, TEXT);
      ctx.fillText(info.small, W / 2, baseY + 14 + smallSize * 0.8);
    }

    let iy = cy + R + 30;
    if (d.inscripcion) {
      ctx.font = `600 34px ${TEXT}`;
      const lw = ctx.measureText('Inscripción').width;
      const vs = fitLine(ctx, d.inscripcion, 420, 68, 36, 800, DISPLAY);
      const vw = ctx.measureText(d.inscripcion).width;
      const startX = W / 2 - (lw + 18 + vw) / 2;
      ctx.textAlign = 'left';
      ctx.font = `600 34px ${TEXT}`;
      ctx.fillStyle = t.muted;
      ctx.fillText('Inscripción', startX, iy + 50);
      ctx.font = `800 ${vs}px ${DISPLAY}`;
      ctx.fillStyle = t.ink;
      ctx.fillText(d.inscripcion, startX + lw + 18, iy + 52);
      iy += 72 + 10;
    }
    if (premioLines.length) {
      ctx.font = `600 34px ${TEXT}`;
      ctx.fillStyle = t.ink;
      ctx.textAlign = 'center';
      premioLines.forEach((l, k) => ctx.fillText(l, W / 2, iy + 30 + k * 42));
      iy += premioLines.length * 42 + 10;
    }

    drawNote(ctx, t, { y: noteTop, align: 'center' });
    drawContacts(ctx, t, d.contactos, { x: M, y: contactsTop, w: W - 2 * M, align: 'center' });
  }

  /* ------------------------------------------------------------------ *
   *  Modelo 4: Afiche — bloque diagonal de color con el título
   * ------------------------------------------------------------------ */
  function tplAfiche(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);

    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 650); ctx.lineTo(0, 760);
    ctx.closePath();
    ctx.fillStyle = t.accent;
    ctx.fill();

    header(ctx, d, t, 150, 120, t.onAccent, 72, t.onAccent);

    ctx.font = `700 34px ${TEXT}`;
    ctx.fillStyle = t.onAccent;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(d.torneoLabel, M, 306);

    const L = layoutHeadline(ctx, d.categorias, { maxW: W - 2 * M, max: 230, min: 90, maxH: 260 });
    drawHeadline(ctx, L, M, 336, 'left', t.onAccent);

    // Pelota decorativa debajo del corte
    drawBall(ctx, t, W - 150, 850, 96);

    const info = dateInfo(d);
    const bs = fitLine(ctx, info.big, 640, 118, 50, 900, DISPLAY);
    ctx.fillStyle = t.ink;
    ctx.textAlign = 'left';
    ctx.fillText(info.big, M, 760 + 30 + bs * 0.78);
    if (info.small) {
      ctx.font = `700 34px ${TEXT}`;
      ctx.fillStyle = t.muted;
      ctx.fillText(info.small, M, 760 + 30 + bs * 0.78 + 50);
    }

    infoCols(ctx, t, d, { x: M, w: W - 2 * M, y: 1000, priceSize: 84 });
    drawNote(ctx, t, { y: 1138 });
    drawContacts(ctx, t, d.contactos, { x: M, y: 1204, w: W - 2 * M });
  }

  /* ------------------------------------------------------------------ *
   *  Modelo 5: Ticket — entrada con muescas y línea de corte
   * ------------------------------------------------------------------ */
  function ticketPath(ctx, x, y, w, h, r, ny, nr) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, ny - nr);
    ctx.arc(x + w, ny, nr, -Math.PI / 2, Math.PI / 2, true);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, ny + nr);
    ctx.arc(x, ny, nr, Math.PI / 2, -Math.PI / 2, true);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function tplTicket(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);

    const x = 60, y = 60, w = W - 120, h = 1230, ny = 640, nr = 36;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.28)';
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 16;
    ticketPath(ctx, x, y, w, h, 40, ny, nr);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ticketPath(ctx, x, y, w, h, 40, ny, nr);
    ctx.clip();
    ctx.fillStyle = t.accent;
    ctx.fillRect(x, y, w, 18);
    ctx.restore();

    const cx = W / 2;
    let yy = centerName(ctx, d, t, { cx, y: y + 54, maxW: w - 120, nameSize: 58, logoSize: 104 }) + 6;
    ctx.font = `600 30px ${TEXT}`;
    ctx.fillStyle = t.muted;
    ctx.fillText(d.torneoLabel, cx, yy + 30);
    yy += 50;

    const L = layoutHeadline(ctx, d.categorias, { maxW: w - 120, max: 170, min: 80, maxH: ny - 44 - yy });
    drawHeadline(ctx, L, cx, yy, 'center', t.ink);

    // Línea de corte
    ctx.save();
    ctx.setLineDash([14, 12]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = t.line;
    ctx.beginPath();
    ctx.moveTo(x + nr + 16, ny); ctx.lineTo(x + w - nr - 16, ny);
    ctx.stroke();
    ctx.restore();

    const info = dateInfo(d);
    const bs = fitLine(ctx, info.big, w - 120, 136, 54, 900, DISPLAY);
    ctx.fillStyle = t.accent;
    ctx.textAlign = 'center';
    ctx.fillText(info.big, cx, ny + 46 + bs * 0.78);
    if (info.small) {
      ctx.font = `700 34px ${TEXT}`;
      ctx.fillStyle = t.muted;
      ctx.fillText(info.small, cx, ny + 46 + bs * 0.78 + 50);
    }

    infoCols(ctx, t, d, { x: x + 60, w: w - 120, y: 922, align: 'center', priceSize: 84 });
    drawNote(ctx, t, { y: 1084, align: 'center', x0: x + 60, x1: x + w - 60 });
    drawContacts(ctx, t, d.contactos, { x: x + 60, y: 1146, w: w - 120, align: 'center' });
  }

  /* ------------------------------------------------------------------ *
   *  Modelo 6: Calendario — hoja de almanaque con el día en grande
   * ------------------------------------------------------------------ */
  function tplCalendario(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);
    header(ctx, d, t, 140, 112, null, 66);

    ctx.font = `600 30px ${TEXT}`;
    ctx.fillStyle = t.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(d.torneoLabel, M, 276);
    const L = layoutHeadline(ctx, d.categorias, { maxW: W - 2 * M, max: 190, min: 90, maxH: 240 });
    drawHeadline(ctx, L, M, 298, 'left', t.ink);

    // Hoja de calendario
    const c = calInfo(d);
    const cx0 = M, cy0 = 580, cw = 470, ch = 470, band = 112;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.25)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;
    roundRect(ctx, cx0, cy0, cw, ch, 30);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, cx0, cy0, cw, ch, 30);
    ctx.clip();
    ctx.fillStyle = t.accent;
    ctx.fillRect(cx0, cy0, cw, band);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const ms = fitLine(ctx, c.month, cw - 80, 70, 30, 800, DISPLAY);
    ctx.fillStyle = t.onAccent;
    ctx.fillText(c.month, cx0 + cw / 2, cy0 + band / 2 + ms * 0.39);

    const ds = fitLine(ctx, c.days, cw - 60, 260, 70, 900, DISPLAY);
    const areaTop = cy0 + band, areaBottom = cy0 + ch - 70;
    ctx.fillStyle = t.ink;
    ctx.fillText(c.days, cx0 + cw / 2, (areaTop + areaBottom) / 2 + ds * 0.39);
    fitLine(ctx, c.dia, cw - 60, 36, 22, 700, TEXT);
    ctx.fillStyle = t.muted;
    ctx.fillText(c.dia, cx0 + cw / 2, cy0 + ch - 26);

    // Argollas
    [cx0 + 120, cx0 + cw - 142].forEach(rx => {
      roundRect(ctx, rx, cy0 - 22, 22, 58, 11);
      ctx.fillStyle = t.ink;
      ctx.fill();
    });

    // Columna derecha: hora, inscripción, premio
    const colX = cx0 + cw + 50, colW = W - M - colX;
    const blocks = [];
    const info = dateInfo(d);
    if (info.hora) blocks.push({ label: 'Hora', value: info.hora, kind: 'big' });
    if (d.inscripcion) blocks.push({ label: 'Inscripción', value: d.inscripcion, kind: 'big' });
    if (d.premio) blocks.push({ label: 'Premio', value: d.premio, kind: 'text' });

    if (!blocks.length) {
      drawBall(ctx, t, colX + colW / 2, cy0 + ch / 2, Math.min(colW / 2, 190));
    } else {
      let by = cy0 + 18;
      blocks.forEach(b => {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.font = `600 28px ${TEXT}`;
        ctx.fillStyle = t.muted;
        ctx.fillText(b.label, colX, by + 24);
        ctx.fillStyle = t.ink;
        if (b.kind === 'big') {
          const s = fitLine(ctx, b.value, colW, 84, 36, 800, DISPLAY);
          ctx.fillText(b.value, colX, by + 24 + 16 + s * 0.78);
          by += 24 + 16 + s * 0.78 + 36;
        } else {
          ctx.font = `700 34px ${TEXT}`;
          const ls = wrapLines(ctx, b.value, colW, 3);
          ls.forEach((l, k) => ctx.fillText(l, colX, by + 24 + 44 + k * 42));
          by += 24 + 44 + (ls.length - 1) * 42 + 30;
        }
      });
    }

    drawNote(ctx, t, { y: 1110 });
    drawContacts(ctx, t, d.contactos, { x: M, y: 1170, w: W - 2 * M });
  }

  const TEMPLATES = [
    { key: 'banda',      label: 'Banda',      draw: tplBanda,      pattern: 'cancha' },
    { key: 'marcador',   label: 'Marcador',   draw: tplMarcador,   pattern: 'diagonales' },
    { key: 'pelota',     label: 'Pelota',     draw: tplPelota,     pattern: 'circulos' },
    { key: 'afiche',     label: 'Afiche',     draw: tplAfiche,     pattern: 'malla' },
    { key: 'ticket',     label: 'Ticket',     draw: tplTicket,     pattern: 'puntos' },
    { key: 'calendario', label: 'Calendario', draw: tplCalendario, pattern: 'liso' }
  ];

  /* ------------------------------------------------------------------ *
   *  UI de paleta / fondo / galería
   * ------------------------------------------------------------------ */
  const DL_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>';
  const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#wa-glyph"/></svg>';

  function buildGallery() {
    TEMPLATES.forEach(tpl => {
      const fig = document.createElement('figure');
      fig.className = 'flyer';
      fig.dataset.template = tpl.key;
      fig.innerHTML =
        `<canvas width="${W}" height="${H}" role="img" aria-label="Flyer modelo ${tpl.label}"></canvas>` +
        '<div class="bar">' +
        `<span class="name">${tpl.label}</span>` +
        '<div class="actions">' +
        `<button type="button" class="fab" data-action="download" aria-label="Descargar flyer ${tpl.label}">${DL_ICON}</button>` +
        `<button type="button" class="fab wa" data-action="share" aria-label="Compartir flyer ${tpl.label} por WhatsApp">${WA_ICON}</button>` +
        '</div></div>';
      gallery.appendChild(fig);
    });
  }

  function buildPalettes() {
    const box = $('#palettes');
    PALETTES.forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.dataset.palette = p.id;
      b.title = p.name;
      b.setAttribute('aria-label', `Paleta ${p.name}`);
      b.style.setProperty('--c1', p.deep);
      b.style.setProperty('--c2', p.primary);
      b.style.setProperty('--c3', p.hi);
      box.appendChild(b);
    });
  }

  function buildPatterns() {
    const box = $('#patterns');
    PATTERNS.forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pat';
      b.dataset.pattern = p.id;
      b.setAttribute('aria-label', p.id === 'auto' ? 'Fondo automático según el modelo' : `Fondo ${p.name}`);
      b.innerHTML = (p.id === 'auto'
        ? '<span class="thumb-auto">Auto</span>'
        : `<canvas width="108" height="135" data-pattern="${p.id}"></canvas>`) + `<span>${p.name}</span>`;
      box.appendChild(b);
    });
  }

  function renderThumbs() {
    const t = getTheme();
    $$('.pat canvas').forEach(c => {
      const ctx = c.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.scale(c.width / W, c.width / W);
      bgFill(ctx, t, c.dataset.pattern, 2.6);
    });
  }

  function syncControls() {
    $$('[data-flyer-theme]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.flyerTheme === state.theme)));
    $$('.swatch').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.palette === state.palette)));
    $$('.pat').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pattern === state.pattern)));
    $('#palette-name').textContent = getPalette().name;
    renderThumbs();
  }

  function saveOpts() {
    try { localStorage.setItem('flyer-opts', JSON.stringify({ theme: state.theme, palette: state.palette, pattern: state.pattern })); } catch (e) { /* sin storage */ }
  }
  function loadOpts() {
    try {
      const o = JSON.parse(localStorage.getItem('flyer-opts'));
      if (!o) return;
      if (o.theme === 'dark' || o.theme === 'light') state.theme = o.theme;
      if (PALETTES.some(p => p.id === o.palette)) state.palette = o.palette;
      if (PATTERNS.some(p => p.id === o.pattern)) state.pattern = o.pattern;
    } catch (e) { /* sin storage */ }
  }

  /* ------------------------------------------------------------------ *
   *  Perfil guardado en el navegador (complejo, logo y contactos)
   * ------------------------------------------------------------------ */
  const PROFILE_KEY = 'flyer-perfil';

  function saveProfile() {
    try {
      const contactos = [...contactsEl.children].map(r => ({
        nombre: r.querySelector('[name=cNombre]').value,
        tel: r.querySelector('[name=cTel]').value
      }));
      localStorage.setItem(PROFILE_KEY, JSON.stringify({
        complejo: form.elements.complejo.value,
        logo: state.logoData,
        contactos
      }));
    } catch (e) { /* sin storage o cuota llena: la app sigue funcionando */ }
  }

  function loadProfile() {
    let p = null;
    try { p = JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch (e) { /* ignorar */ }
    if (!p) return;
    if (typeof p.complejo === 'string') form.elements.complejo.value = p.complejo;
    if (Array.isArray(p.contactos) && p.contactos.length) {
      const list = p.contactos.slice(0, 3);
      while (contactsEl.children.length < list.length) addContact();
      list.forEach((c, i) => {
        const row = contactsEl.children[i];
        row.querySelector('[name=cNombre]').value = c.nombre || '';
        row.querySelector('[name=cTel]').value = c.tel || '';
      });
    }
    if (typeof p.logo === 'string' && p.logo.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => {
        state.logo = img;
        state.logoData = p.logo;
        logoPreview.src = p.logo;
        logoChip.hidden = false;
        render();
      };
      img.src = p.logo;
    }
  }

  // Reduce el logo para que ocupe poco en localStorage.
  function logoToDataURL(img) {
    try {
      const iw = img.naturalWidth || img.width || 300;
      const ih = img.naturalHeight || img.height || 300;
      const sc = Math.min(1, 512 / Math.max(iw, ih));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(iw * sc));
      c.height = Math.max(1, Math.round(ih * sc));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/png');
    } catch (e) {
      return null;
    }
  }

  function clearProfile() {
    try { localStorage.removeItem(PROFILE_KEY); } catch (e) { /* ignorar */ }
    form.elements.complejo.value = '';
    [...contactsEl.children].slice(1).forEach(r => r.remove());
    const first = contactsEl.children[0];
    first.querySelector('[name=cNombre]').value = '';
    first.querySelector('[name=cTel]').value = '';
    refreshContacts();
    state.logo = null;
    state.logoData = null;
    logoInput.value = '';
    logoChip.hidden = true;
    render();
    toast('Borramos los datos guardados de este navegador.');
  }

  /* ------------------------------------------------------------------ *
   *  Render
   * ------------------------------------------------------------------ */
  async function render() {
    await fontsReady;
    const { data, missing } = readData();

    if (missing.length) {
      missingEl.innerHTML = missing.map(m => `<li>${m}</li>`).join('');
      emptyEl.hidden = false;
      gallery.hidden = true;
      return;
    }
    emptyEl.hidden = true;
    gallery.hidden = false;

    const theme = getTheme();
    for (const tpl of TEMPLATES) {
      const canvas = $(`.flyer[data-template="${tpl.key}"] canvas`);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      tpl.draw(ctx, data, theme, state.pattern === 'auto' ? tpl.pattern : state.pattern);
      state.blobs[tpl.key] = null;
      canvas.toBlob(b => { state.blobs[tpl.key] = b; }, 'image/png');
    }
  }

  let timer = null;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => { saveProfile(); render(); }, 120);
  }

  /* ------------------------------------------------------------------ *
   *  Compartir / descargar
   * ------------------------------------------------------------------ */
  function slug(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const toBlob = canvas => new Promise(res => canvas.toBlob(res, 'image/png'));

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function getFlyer(key) {
    const { data } = readData();
    const canvas = $(`.flyer[data-template="${key}"] canvas`);
    const blob = state.blobs[key] || await toBlob(canvas);
    const name = `flyer-${key}-${slug(data.categorias[0]) || 'torneo'}.png`;
    return { data, blob, name };
  }

  async function shareFlyer(key) {
    const { blob, name } = await getFlyer(key);
    const file = new File([blob], name, { type: 'image/png' });

    // Móvil: selector nativo (WhatsApp incluido) con SOLO la imagen: sin texto ni título.
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    // Escritorio: descarga la imagen, la copia al portapapeles (si el navegador deja)
    // y abre WhatsApp Web sin texto, para pegarla (Ctrl+V) o adjuntarla en el chat.
    download(blob, name);
    let copiada = false;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        copiada = true;
      }
    } catch (_) { /* sin permiso: queda la descarga */ }
    window.open('https://web.whatsapp.com/', '_blank', 'noopener');
    toast(copiada
      ? 'Descargamos el flyer y lo copiamos: pegalo en el chat de WhatsApp.'
      : 'Descargamos el flyer. Adjuntalo en el chat de WhatsApp.');
  }

  async function downloadFlyer(key) {
    const { blob, name } = await getFlyer(key);
    download(blob, name);
  }

  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 4200);
  }

  /* ------------------------------------------------------------------ *
   *  Tema de la app (compartido con el sitio de proyectos: clave "theme")
   * ------------------------------------------------------------------ */
  function initAppTheme() {
    const root = document.documentElement;
    const btn = $('#app-theme');
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
    } catch (e) { /* sin storage */ }
    const sync = () => { btn.textContent = root.getAttribute('data-theme') === 'dark' ? '🌙' : '☀️'; };
    sync();
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* sin storage */ }
      sync();
    });
  }

  /* ------------------------------------------------------------------ *
   *  Eventos
   * ------------------------------------------------------------------ */
  form.addEventListener('input', schedule);
  form.addEventListener('change', schedule);
  form.addEventListener('submit', e => e.preventDefault());

  form.elements.inscripcion.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });

  addContactBtn.addEventListener('click', () => { addContact(); schedule(); });
  addCategoriaBtn.addEventListener('click', () => { addCategoria(); schedule(); });

  logoInput.addEventListener('change', () => {
    const file = logoInput.files && logoInput.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      state.logo = img;
      state.logoData = logoToDataURL(img);
      logoPreview.src = url;
      logoChip.hidden = false;
      saveProfile();
      render();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      logoInput.value = '';
      toast('No pudimos leer esa imagen. Probá con un PNG o JPG.');
    };
    img.src = url;
  });

  $('#logo-remove').addEventListener('click', () => {
    state.logo = null;
    state.logoData = null;
    logoInput.value = '';
    logoChip.hidden = true;
    saveProfile();
    render();
  });

  $('#clear-saved').addEventListener('click', clearProfile);

  $('.toolbar').addEventListener('click', e => {
    const th = e.target.closest('[data-flyer-theme]');
    const pa = e.target.closest('[data-palette]');
    const pt = e.target.closest('[data-pattern]');
    if (th) state.theme = th.dataset.flyerTheme;
    else if (pa) state.palette = pa.dataset.palette;
    else if (pt) state.pattern = pt.dataset.pattern;
    else return;
    saveOpts();
    syncControls();
    render();
  });

  gallery.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const key = btn.closest('.flyer').dataset.template;
    if (btn.dataset.action === 'share') shareFlyer(key);
    else downloadFlyer(key);
  });

  /* ------------------------------------------------------------------ *
   *  Versión y aviso de actualización
   *  version.js (cargado antes que este archivo) define la versión que está corriendo;
   *  version.json es la que está publicada. Si el build es distinto, se avisa.
   * ------------------------------------------------------------------ */
  const APP = window.APP_INFO || { version: '0.0.0', build: 'dev', fecha: '' };
  const REVISAR_CADA_MS = 5 * 60 * 1000;
  let avisoEl = null;
  let versionCerrada = null; // "Más tarde" oculta el cartel hasta que salga otra versión

  function showVersion() {
    const el = $('#app-version');
    if (!el) return;
    el.textContent = `v${APP.version}`;
    if (APP.fecha) {
      const f = new Date(APP.fecha).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
      });
      el.title = `Build ${APP.build} · ${f}`;
    } else {
      el.title = `Build ${APP.build}`;
    }
  }

  // version.json publicado (sin caché). null si no se pudo leer (sin conexión, local, etc.)
  async function versionPublicada() {
    try {
      const r = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) return null;
      const v = await r.json();
      return v && v.build ? { version: String(v.version || ''), build: String(v.build) } : null;
    } catch (_) {
      return null;
    }
  }

  // Recarga trayendo la versión nueva: ?v=<build> saltea la caché del index.html
  // (GitHub Pages lo cachea unos minutos).
  function recargar(build) {
    const url = new URL(window.location.href);
    url.searchParams.set('v', build || String(Date.now()));
    window.location.replace(url.toString());
  }

  function mostrarAviso(nueva) {
    if (avisoEl) avisoEl.remove();
    avisoEl = document.createElement('div');
    avisoEl.className = 'update-banner';
    avisoEl.setAttribute('role', 'status');
    avisoEl.setAttribute('aria-live', 'polite');

    const msg = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = `Hay una versión nueva${nueva.version ? ` (v${nueva.version})` : ''}.`;
    msg.append(strong, ' Actualizá para ver los últimos cambios. Los datos que no se guardan solos (categorías, fechas, premio) se pierden.');

    const ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'btn primary';
    ok.textContent = 'Actualizar';
    ok.addEventListener('click', () => recargar(nueva.build));

    const later = document.createElement('button');
    later.type = 'button';
    later.className = 'update-close';
    later.setAttribute('aria-label', 'Más tarde');
    later.title = 'Más tarde';
    later.textContent = '✕';
    later.addEventListener('click', () => {
      versionCerrada = nueva.build;
      avisoEl.remove();
      avisoEl = null;
    });

    avisoEl.append(msg, ok, later);
    document.body.appendChild(avisoEl);
  }

  async function revisarVersion() {
    if (document.visibilityState !== 'visible') return;
    const v = await versionPublicada();
    if (!v || v.build === APP.build || v.build === versionCerrada) return;
    mostrarAviso(v);
  }

  function initVersion() {
    showVersion();
    revisarVersion();
    setInterval(revisarVersion, REVISAR_CADA_MS);
    document.addEventListener('visibilitychange', revisarVersion);
    window.addEventListener('online', revisarVersion);
  }

  /* ------------------------------------------------------------------ *
   *  Init
   * ------------------------------------------------------------------ */
  initAppTheme();
  initVersion();
  loadOpts();
  buildGallery();
  buildPalettes();
  buildPatterns();
  syncControls();
  addCategoria();
  addContact();
  loadProfile();
  render();
})();
