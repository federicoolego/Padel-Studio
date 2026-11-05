(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  Constantes
   * ------------------------------------------------------------------ */
  const W = 1080;           // ancho del flyer (px)
  const H = 1350;           // alto del flyer (px) -> relación 4:5, ideal para WhatsApp
  const M = 72;             // margen

  const DISPLAY = '"Big Shoulders Display","Arial Narrow",Impact,sans-serif';
  const TEXT = 'Figtree,system-ui,-apple-system,"Segoe UI",sans-serif';

  // Paletas de los flyers. Para cambiar la identidad visual, tocá acá.
  const THEMES = {
    dark: {
      bg: '#0E2750', bg2: '#0A1D3D', panel: '#17366C',
      ink: '#FFFFFF', muted: '#A9BEDD', line: 'rgba(255,255,255,.17)',
      accent: '#D8EE3A', onAccent: '#0E2750',
      ball: '#D8EE3A', onBall: '#0E2750'
    },
    light: {
      bg: '#F1F6FB', bg2: '#DFEAF6', panel: '#FFFFFF',
      ink: '#0E2750', muted: '#4F668C', line: 'rgba(14,39,80,.17)',
      accent: '#1B5FD1', onAccent: '#FFFFFF',
      ball: '#D8EE3A', onBall: '#0E2750'
    }
  };

  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MESES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* ------------------------------------------------------------------ *
   *  Estado y DOM
   * ------------------------------------------------------------------ */
  const state = { theme: 'dark', logo: null, blobs: {} };
  const $ = (s, r = document) => r.querySelector(s);

  const form = $('#form');
  const contactsEl = $('#contacts');
  const addContactBtn = $('#add-contact');
  const logoInput = $('#logo');
  const logoChip = $('#logo-chip');
  const logoPreview = $('#logo-preview');
  const gallery = $('#gallery');
  const emptyEl = $('#empty');
  const missingEl = $('#missing');
  const toastEl = $('#toast');

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
      '<input type="text" name="cNombre" maxlength="30" placeholder="Nombre">' +
      '<input type="tel" name="cTel" maxlength="22" placeholder="Teléfono" inputmode="tel">' +
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

    const digits = v('inscripcion').replace(/\D/g, '');
    const data = {
      complejo: v('complejo'),
      logo: state.logo,
      categoria: v('categoria'),
      inicio: v('inicio'),
      hora: v('hora'),
      fin: v('fin'),
      inscripcion: digits ? '$' + digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '',
      premio: v('premio'),
      contactos: completos
    };

    const missing = [];
    if (!data.complejo) missing.push('Nombre del complejo');
    if (!data.categoria) missing.push('Categoría del torneo');
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

  function dateInfo(d) {
    const s = parseDate(d.inicio);
    const e = d.fin ? parseDate(d.fin) : null;
    const hora = d.hora ? `${d.hora} hs` : '';
    if (!e || e.getTime() === s.getTime()) {
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

  function dateLong(d) {
    const s = parseDate(d.inicio);
    const e = d.fin ? parseDate(d.fin) : null;
    const f = x => `${DIAS[x.getDay()]} ${x.getDate()} de ${MESES[x.getMonth()]}`;
    let txt = e && e.getTime() !== s.getTime() ? `Del ${f(s)} al ${f(e)}` : cap(f(s));
    if (d.hora) txt += `, ${d.hora} hs`;
    return txt;
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

  function bgFill(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, t.bg);
    g.addColorStop(1, t.bg2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
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

  function layoutHeadline(ctx, text, { maxW, max, min, lines = 2, weight = 900 }) {
    const up = text.toUpperCase();
    let size = max;
    let ls;
    for (;;) {
      ctx.font = `${weight} ${size}px ${DISPLAY}`;
      ls = wrapLines(ctx, up, maxW);
      const ok = ls.length <= lines && ls.every(l => ctx.measureText(l).width <= maxW);
      if (ok || size <= min) break;
      size -= 4;
    }
    if (ls.length > lines) ls = wrapLines(ctx, up, maxW, lines);
    const lh = size * 0.9;
    return { ls, size, lh, weight, height: size * 0.78 + (ls.length - 1) * lh };
  }

  // Dibuja el titular con su borde superior en y. Devuelve el y inferior (baseline de la última línea).
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

  // Logo + nombre del complejo alineados a la izquierda, centrados verticalmente en cy.
  function header(ctx, d, t, cy, size) {
    let tx = M;
    if (d.logo) {
      drawLogo(ctx, d.logo, M + size / 2, cy, size, t);
      tx = M + size + 28;
    }
    ctx.font = `700 42px ${TEXT}`;
    const lines = wrapLines(ctx, d.complejo, W - M - tx, 2);
    const lh = 50;
    const top = cy - (lines.length * lh) / 2;
    ctx.fillStyle = t.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    lines.forEach((l, i) => ctx.fillText(l, tx, top + i * lh + 36));
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

  /* ------------------------------------------------------------------ *
   *  Modelo 1: Cancha — líneas de cancha de fondo, fecha en banda de color
   * ------------------------------------------------------------------ */
  function tplCancha(ctx, d, t) {
    bgFill(ctx, t);

    // Cancha vista desde arriba (líneas del perímetro, saques y red)
    ctx.strokeStyle = t.line;
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    const mid = H / 2;
    ctx.beginPath();
    ctx.moveTo(40, mid - 440); ctx.lineTo(W - 40, mid - 440);
    ctx.moveTo(40, mid + 440); ctx.lineTo(W - 40, mid + 440);
    ctx.moveTo(W / 2, mid - 440); ctx.lineTo(W / 2, mid + 440);
    ctx.stroke();
    ctx.lineWidth = 8;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(40, mid); ctx.lineTo(W - 40, mid);
    ctx.stroke();
    ctx.setLineDash([]);

    header(ctx, d, t, 150, 120);

    pill(ctx, t, 'Torneo de pádel', M, 290, 'left');

    // Titular centrado verticalmente en la zona 380–770
    const L = layoutHeadline(ctx, d.categoria, { maxW: W - 2 * M, max: 210, min: 100 });
    const blockH = L.height + 40 + 14;
    const top = 380 + (390 - blockH) / 2;
    const bottom = drawHeadline(ctx, L, M, top, 'left', t.ink);
    roundRect(ctx, M, bottom + 40, 170, 14, 7);
    ctx.fillStyle = t.accent;
    ctx.fill();

    // Banda de fecha
    const info = dateInfo(d);
    const bandY = 800, bandH = 190;
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

    // Inscripción / premio
    const items = [];
    if (d.inscripcion) items.push({ label: 'Inscripción', value: d.inscripcion, kind: 'price' });
    if (d.premio) items.push({ label: 'Premio', value: d.premio, kind: 'text' });
    if (items.length) {
      const gap = 40;
      const cw = (W - 2 * M - gap * (items.length - 1)) / items.length;
      items.forEach((it, i) => {
        const x = M + i * (cw + gap);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.font = `600 28px ${TEXT}`;
        ctx.fillStyle = t.muted;
        ctx.fillText(it.label, x, 1034);
        ctx.fillStyle = t.ink;
        if (it.kind === 'price') {
          fitLine(ctx, it.value, cw, 92, 40, 800, DISPLAY);
          ctx.fillText(it.value, x, 1122);
        } else {
          ctx.font = `700 36px ${TEXT}`;
          wrapLines(ctx, it.value, cw, 2).forEach((l, k) => ctx.fillText(l, x, 1086 + k * 44));
        }
      });
    }

    // Contactos
    ctx.strokeStyle = t.line;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(M, 1160); ctx.lineTo(W - M, 1160);
    ctx.stroke();
    drawContacts(ctx, t, d.contactos, { x: M, y: 1182, w: W - 2 * M });
  }

  /* ------------------------------------------------------------------ *
   *  Modelo 2: Marcador — tabla estilo scoreboard
   * ------------------------------------------------------------------ */
  function tplMarcador(ctx, d, t) {
    bgFill(ctx, t);

    ctx.fillStyle = t.bg2;
    ctx.fillRect(0, 0, W, 230);
    ctx.fillStyle = t.accent;
    ctx.fillRect(0, 230, W, 8);
    header(ctx, d, t, 115, 124);

    let y = pill(ctx, t, 'Torneo de pádel', M, 290, 'left');
    const L = layoutHeadline(ctx, d.categoria, { maxW: W - 2 * M, max: 180, min: 96 });
    y = drawHeadline(ctx, L, M, y + 34, 'left', t.ink);

    const info = dateInfo(d);
    const rows = [{ label: info.label, value: info.big, w: 1 }];
    if (info.hora) rows.push({ label: 'Hora', value: info.hora, w: 1 });
    if (d.inscripcion) rows.push({ label: 'Inscripción', value: d.inscripcion, w: 1 });
    if (d.premio) rows.push({ label: 'Premio', value: d.premio, w: 1.5, wrap: true });

    const footTop = 1128;
    const tableTop = y + 56;
    const avail = footTop - 44 - tableTop;
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
      fitLine(ctx, r.label.toUpperCase(), labelW - 56, Math.min(46, h * 0.5), 20, 800, DISPLAY);
      ctx.fillStyle = t.onAccent;
      ctx.fillText(r.label.toUpperCase(), M + 28, ry + h / 2 + 2);

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
        fitLine(ctx, r.value, vw, Math.min(92, h * 0.72), 28, 800, DISPLAY);
        ctx.fillText(r.value, vx, ry + h / 2 + 2);
      }
      if (i > 0) {
        ctx.fillStyle = t.bg;
        ctx.fillRect(M, ry, W - 2 * M, 4);
      }
      ry += h;
    });
    ctx.restore();

    // Pie con contactos
    ctx.fillStyle = t.bg2;
    ctx.fillRect(0, footTop, W, H - footTop);
    ctx.fillStyle = t.accent;
    ctx.fillRect(0, footTop, W, 8);
    drawContacts(ctx, t, d.contactos, { x: M, y: footTop + 62, w: W - 2 * M });
  }

  /* ------------------------------------------------------------------ *
   *  Modelo 3: Pelota — la fecha dentro de una pelota, composición centrada
   * ------------------------------------------------------------------ */
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

  function tplPelota(ctx, d, t) {
    const g = ctx.createRadialGradient(W / 2, H * 0.55, 60, W / 2, H * 0.55, 960);
    g.addColorStop(0, t.panel);
    g.addColorStop(1, t.bg);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    let y = 64;
    if (d.logo) {
      drawLogo(ctx, d.logo, W / 2, y + 60, 120, t);
      y += 120 + 26;
    }
    ctx.font = `700 40px ${TEXT}`;
    const nameLines = wrapLines(ctx, d.complejo, W - 2 * M, 2);
    ctx.fillStyle = t.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    nameLines.forEach((l, i) => ctx.fillText(l, W / 2, y + 34 + i * 48));
    y += nameLines.length * 48 + 18;

    ctx.font = `600 32px ${TEXT}`;
    ctx.fillStyle = t.muted;
    ctx.fillText('Torneo de pádel', W / 2, y + 28);
    y += 44;

    const L = layoutHeadline(ctx, d.categoria, { maxW: W - 2 * M, max: 200, min: 100 });
    y = drawHeadline(ctx, L, W / 2, y, 'center', t.ink) + 46;

    // Alto del bloque inscripción/premio, para repartir el espacio con la pelota
    let premioLines = [];
    let infoH = 0;
    if (d.inscripcion) infoH += 72;
    if (d.premio) {
      ctx.font = `600 34px ${TEXT}`;
      premioLines = wrapLines(ctx, 'Premio: ' + d.premio, W - 2 * M - 80, 2);
      infoH += (d.inscripcion ? 12 : 0) + premioLines.length * 42;
    }

    const contactsTop = 1190;
    const spaceBottom = contactsTop - 34 - (infoH ? infoH + 30 : 0);
    const R = Math.max(120, Math.min(240, (spaceBottom - y) / 2));
    const cy = y + R;
    drawBall(ctx, t, W / 2, cy, R);

    // Fecha dentro de la pelota
    const info = dateInfo(d);
    const bigSize = fitLine(ctx, info.big, R * 2 * 0.8, Math.round(R * 0.62), 36, 900, DISPLAY);
    const smallSize = Math.max(22, Math.round(R * 0.14));
    const smallH = info.small ? 14 + smallSize * 0.8 : 0;
    const contentH = bigSize * 0.78 + smallH;
    const baseY = cy - contentH / 2 + bigSize * 0.78;
    ctx.fillStyle = t.onBall;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(info.big, W / 2, baseY);
    if (info.small) {
      fitLine(ctx, info.small, R * 2 * 0.8, smallSize, 16, 700, TEXT);
      ctx.fillText(info.small, W / 2, baseY + 14 + smallSize * 0.8);
    }

    // Inscripción y premio
    let iy = cy + R + 34;
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
      iy += 72 + 12;
    }
    if (premioLines.length) {
      ctx.font = `600 34px ${TEXT}`;
      ctx.fillStyle = t.ink;
      ctx.textAlign = 'center';
      premioLines.forEach((l, k) => ctx.fillText(l, W / 2, iy + 30 + k * 42));
    }

    ctx.strokeStyle = t.line;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(M, contactsTop - 28); ctx.lineTo(W - M, contactsTop - 28);
    ctx.stroke();
    drawContacts(ctx, t, d.contactos, { x: M, y: contactsTop, w: W - 2 * M, align: 'center' });
  }

  const TEMPLATES = { cancha: tplCancha, marcador: tplMarcador, pelota: tplPelota };

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

    const theme = THEMES[state.theme];
    for (const fig of gallery.querySelectorAll('.flyer')) {
      const key = fig.dataset.template;
      const canvas = $('canvas', fig);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      TEMPLATES[key](ctx, data, theme);
      state.blobs[key] = null;
      canvas.toBlob(b => { state.blobs[key] = b; }, 'image/png');
    }
  }

  let timer = null;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(render, 120);
  }

  /* ------------------------------------------------------------------ *
   *  Compartir / descargar
   * ------------------------------------------------------------------ */
  function slug(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function buildText(d) {
    const lines = [`🎾 Torneo ${d.categoria} - ${d.complejo}`, `📅 ${dateLong(d)}`];
    if (d.inscripcion) lines.push(`💰 Inscripción: ${d.inscripcion}`);
    if (d.premio) lines.push(`🏆 Premio: ${d.premio}`);
    lines.push('📞 Inscripciones:');
    d.contactos.forEach(c => lines.push(`${c.nombre}: ${c.tel}`));
    return lines.join('\n');
  }

  function toBlob(canvas) {
    return new Promise(res => canvas.toBlob(res, 'image/png'));
  }

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
    const name = `flyer-${key}-${slug(data.categoria) || 'torneo'}.png`;
    return { data, blob, name };
  }

  async function shareFlyer(key) {
    const { data, blob, name } = await getFlyer(key);
    const text = buildText(data);
    const file = new File([blob], name, { type: 'image/png' });

    // Móvil: abre el selector nativo (WhatsApp incluido) con la imagen adjunta.
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    // Escritorio: descarga la imagen y abre WhatsApp con el texto listo.
    download(blob, name);
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
    toast('Descargamos el flyer. Adjuntalo en el chat de WhatsApp.');
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
   *  Eventos
   * ------------------------------------------------------------------ */
  form.addEventListener('input', schedule);
  form.addEventListener('change', schedule);
  form.addEventListener('submit', e => e.preventDefault());

  // Inscripción: solo dígitos
  form.elements.inscripcion.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });

  addContactBtn.addEventListener('click', () => { addContact(); schedule(); });

  logoInput.addEventListener('change', () => {
    const file = logoInput.files && logoInput.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      state.logo = img;
      logoPreview.src = url;
      logoChip.hidden = false;
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
    logoInput.value = '';
    logoChip.hidden = true;
    render();
  });

  document.querySelectorAll('.segmented button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.theme = btn.dataset.theme;
      document.querySelectorAll('.segmented button').forEach(b =>
        b.setAttribute('aria-pressed', String(b === btn)));
      render();
    });
  });

  gallery.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const key = btn.closest('.flyer').dataset.template;
    if (btn.dataset.action === 'share') shareFlyer(key);
    else downloadFlyer(key);
  });

  /* ------------------------------------------------------------------ *
   *  Init
   * ------------------------------------------------------------------ */
  addContact();
  render();
})();
