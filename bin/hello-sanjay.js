#!/usr/bin/env node

const reset = '\u001b[0m';
const bold  = '\u001b[1m';
const SEP   = '__SEP__';

const CARD = {
  ascii: [
    '██╗  ██╗███████╗██╗     ██╗      ██████╗ ██╗',
    '██║  ██║██╔════╝██║     ██║     ██╔═══██╗██║',
    '███████║█████╗  ██║     ██║     ██║   ██║██║',
    '██╔══██║██╔══╝  ██║     ██║     ██║   ██║╚═╝',
    '██║  ██║███████╗███████╗███████╗╚██████╔╝██╗',
    '╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝ ╚═════╝ ╚═╝',
  ],
  tagline: "How you doin'? 😉",
  links: [
    { label: 'GitHub',   url: 'github.com/sanjayb-28'      },
    { label: 'LinkedIn', url: 'linkedin.com/in/sanjayb-28' },
    { label: 'Website',  url: 'sanjaybaskaran.dev'          },
  ],
};

const TTY = process.stdout.isTTY;
const termWidth = (process.stdout && process.stdout.columns) || 80;

function colorLevel() {
  if (process.env.FORCE_COLOR === '0') return 0;
  const { TERM, COLORTERM } = process.env;
  if (COLORTERM && COLORTERM.toLowerCase().includes('truecolor')) return 3;
  if (TERM && /-256color$/.test(TERM)) return 2;
  return TTY ? 1 : 0;
}
const LEVEL = colorLevel();

function rgb256(r, g, b) {
  return 16 + 36 * Math.round(r / 51) + 6 * Math.round(g / 51) + Math.round(b / 51);
}
function paintRGB(r, g, b, s) {
  if (LEVEL >= 3) return `\x1b[38;2;${r};${g};${b}m${s}${reset}`;
  if (LEVEL === 2) return `\x1b[38;5;${rgb256(r, g, b)}m${s}${reset}`;
  if (LEVEL === 1) return `${bold}${s}${reset}`;
  return s;
}
function lerp(a, b, t) { return a + (b - a) * t; }
function lerpRGB(a, b, t) {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}
function ease(u) { return u * u * (3 - 2 * u); }

const BORDER_RGB = [ 50, 120, 255];
const LABEL_RGB  = [200, 220, 255];  
const TAG_RGB    = [255, 185,  50];  // warm amber
const ARROW_RGB  = [ 80, 100, 180];  // muted indigo
const URL_RGB    = [  0, 210, 190];
const HELLO_STOPS = [
  [120,  40, 255],
  [ 70,  80, 255],
  [  0, 150, 255],
  [  0, 215, 230],
];

function gradientLine(line, stops) {
  if (!line) return line;
  const chars = [...line];
  const n = chars.length, segs = stops.length - 1;
  let out = '';
  for (let i = 0; i < n; i++) {
    const u  = n > 1 ? i / (n - 1) : 0;
    const ue = ease(u);
    const k  = Math.min(segs - 1, Math.floor(ue * segs));
    const [r, g, b] = lerpRGB(stops[k], stops[k + 1] || stops[k], ue * segs - k);
    out += paintRGB(r, g, b, chars[i]);
  }
  return out + reset;
}

function truncatePlain(s, w) {
  return s.length <= w ? s : (w <= 1 ? '…' : s.slice(0, w - 1) + '…');
}

function printCard() {
  const maxLabel = Math.max(...CARD.links.map(l => l.label.length));
  const linkLines = CARD.links.map(({ label, url }) =>
    `${label.padEnd(maxLabel)}  →  ${url}`
  );

  const plainLines = [
    ...CARD.ascii,
    '',
    CARD.tagline,
    SEP,
    ...linkLines,
  ];

  const padding = 3;
  let contentWidth = 0;
  for (const l of plainLines) {
    if (l !== SEP) contentWidth = Math.max(contentWidth, l.length);
  }

  const maxBoxWidth = Math.max(20, termWidth - 4);
  const innerWidth  = Math.min(contentWidth + padding * 2, maxBoxWidth);
  const leftMargin  = Math.max(0, Math.floor((termWidth - (innerWidth + 2)) / 2));

  const top    = paintRGB(...BORDER_RGB, '╔' + '═'.repeat(innerWidth) + '╗');
  const mid    = paintRGB(...BORDER_RGB, '╠' + '═'.repeat(innerWidth) + '╣');
  const bottom = paintRGB(...BORDER_RGB, '╚' + '═'.repeat(innerWidth) + '╝');
  const side   = paintRGB(...BORDER_RGB, '║');

  const out = [];
  out.push(' '.repeat(leftMargin) + top);

  for (let i = 0; i < plainLines.length; i++) {
    const raw = plainLines[i];

    if (raw === SEP) {
      out.push(' '.repeat(leftMargin) + mid);
      continue;
    }

    const clamped = raw.length > innerWidth ? truncatePlain(raw, innerWidth) : raw;
    let colored;

    if (i < CARD.ascii.length) {
      colored = gradientLine(clamped, HELLO_STOPS);
    } else if (raw === CARD.tagline) {
      colored = paintRGB(...TAG_RGB, clamped);
    } else {
      const link = CARD.links.find(({ label, url }) =>
        raw === `${label.padEnd(maxLabel)}  →  ${url}`
      );
      if (link) {
        colored = paintRGB(...LABEL_RGB, link.label.padEnd(maxLabel))
          + paintRGB(...ARROW_RGB, '  →  ')
          + paintRGB(...URL_RGB, link.url);
      } else {
        colored = clamped;
      }
    }

    const leftSpaces  = Math.max(0, Math.floor((innerWidth - clamped.length) / 2));
    const rightSpaces = Math.max(0, innerWidth - clamped.length - leftSpaces);
    out.push(
      ' '.repeat(leftMargin) + side
      + ' '.repeat(leftSpaces) + colored + ' '.repeat(rightSpaces)
      + side + reset
    );
  }

  out.push(' '.repeat(leftMargin) + bottom);
  console.log('\n' + out.join('\n') + '\n');
}

try { printCard(); }
catch (err) {
  console.error('Render error:', err && err.message ? err.message : err);
  process.exit(1);
}
