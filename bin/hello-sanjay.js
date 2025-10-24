#!/usr/bin/env node

const reset = '\u001b[0m';
const bold  = '\u001b[1m';

const CARD = {
  ascii: [
    '██╗  ██╗███████╗██╗     ██╗      ██████╗ ██╗',
    '██║  ██║██╔════╝██║     ██║     ██╔═══██╗██║',
    '███████║█████╗  ██║     ██║     ██║   ██║██║',
    '██╔══██║██╔══╝  ██║     ██║     ██║   ██║╚═╝',
    '██║  ██║███████╗███████╗███████╗╚██████╔╝██╗',
    '╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝ ╚═════╝ ╚═╝',
    '                                            '
  ],
  tagline: "How you doin'? 😉",
  github:   { label: 'GitHub:',   url: 'https://github.com/sanjayb-28' },
  linkedin: { label: 'LinkedIn:', url: 'https://www.linkedin.com/in/sanjayb-28/' },
  website:  { label: 'Website:',  url: 'https://sanjay-baskaran.vercel.app' }
};

const TTY = process.stdout.isTTY;
const termWidth = (process && process.stdout && process.stdout.columns) ? process.stdout.columns : 80;

function colorLevel() {
  if (process.env.FORCE_COLOR === '0') return 0;
  const { TERM, COLORTERM } = process.env;
  if (COLORTERM && COLORTERM.toLowerCase().includes('truecolor')) return 3;
  if (TERM && /-256color$/.test(TERM)) return 2;
  return TTY ? 1 : 0;
}
const LEVEL = colorLevel();

function rgb256(r,g,b){ const r6=Math.round(r/51),g6=Math.round(g/51),b6=Math.round(b/51); return 16+36*r6+6*g6+b6; }
function paintRGB(r,g,b,s){
  if (LEVEL>=3) return `\x1b[38;2;${r};${g};${b}m${s}${reset}`;
  if (LEVEL===2) return `\x1b[38;5;${rgb256(r,g,b)}m${s}${reset}`;
  if (LEVEL===1) return `${bold}${s}${reset}`;
  return s;
}
function lerp(a,b,t){ return a+(b-a)*t; }
function lerpRGB(a,b,t){ return [Math.round(lerp(a[0],b[0],t)),Math.round(lerp(a[1],b[1],t)),Math.round(lerp(a[2],b[2],t))]; }
function ease(u){ return u*u*(3-2*u); }

/* COOL, LIGHT-MODE-SAFE PALETTE */
const BORDER_RGB = [52,100,255];    // royal neon blue (frame)
const LABEL_RGB  = [150,70,255];    // neon violet (labels)
const URL_RGB    = [0,135,140];     // cool dark teal (links)
const TAG_RGB    = [24,90,210];     // deep azure (tagline)

/* “Tokyo-cool” HELLO: indigo → electric blue → cyan → seafoam */
const HELLO_STOPS = [
  [88, 60, 255],
  [40,110,255],
  [ 0,170,235],
  [ 0,160,135]
];

function gradientLine(line, stops){
  if (!line) return line;
  const chars=[...line];
  const n=chars.length, segs=stops.length-1;
  let out='';
  for(let i=0;i<n;i++){
    const u = n>1 ? i/(n-1) : 0;
    const ue = ease(u);
    const k = Math.min(segs-1, Math.floor(ue*segs));
    const t = (ue*segs) - k;
    const [r,g,b] = lerpRGB(stops[k], stops[k+1]||stops[k], t);
    out += paintRGB(r,g,b, chars[i]);
  }
  return out + reset;
}

function truncatePlain(s, w){ return s.length<=w ? s : (w<=1 ? '…' : s.slice(0,w-1)+'…'); }

function printCard(){
  const lines = [
    ...CARD.ascii,
    '',
    CARD.tagline,
    '',
    `${CARD.github.label} ${CARD.github.url}`,
    `${CARD.linkedin.label} ${CARD.linkedin.url}`,
    `${CARD.website.label} ${CARD.website.url}`
  ];

  const padding = 2;
  let contentWidth = 0;
  for (const l of lines) contentWidth = Math.max(contentWidth, l.length);

  const maxBoxWidth = Math.max(20, termWidth - 4);
  const innerWidth = Math.min(contentWidth + padding*2, maxBoxWidth);
  const leftMargin = Math.max(0, Math.floor((termWidth - (innerWidth + 2)) / 2));

  const borderTop = '┌' + '─'.repeat(innerWidth) + '┐';
  const borderBot = '└' + '─'.repeat(innerWidth) + '┘';
  const side      = paintRGB(...BORDER_RGB, '│');
  const top       = paintRGB(...BORDER_RGB, borderTop);
  const bottom    = paintRGB(...BORDER_RGB, borderBot);

  const out = [];
  out.push(' '.repeat(leftMargin) + top);

  for (let i=0;i<lines.length;i++){
    let raw = lines[i];
    if (raw.length > innerWidth) raw = truncatePlain(raw, innerWidth);

    let colored = raw;
    if (i < CARD.ascii.length) {
      colored = gradientLine(raw, HELLO_STOPS);
    } else if (raw === CARD.tagline) {
      colored = paintRGB(...TAG_RGB, raw);
    } else if (raw.startsWith(CARD.github.label)) {
      colored = paintRGB(...LABEL_RGB, CARD.github.label) + ' ' + paintRGB(...URL_RGB, CARD.github.url);
    } else if (raw.startsWith(CARD.linkedin.label)) {
      colored = paintRGB(...LABEL_RGB, CARD.linkedin.label) + ' ' + paintRGB(...URL_RGB, CARD.linkedin.url);
    } else if (raw.startsWith(CARD.website.label)) {
      colored = paintRGB(...LABEL_RGB, CARD.website.label) + ' ' + paintRGB(...URL_RGB, CARD.website.url);
    }

    const leftSpaces = Math.max(0, Math.floor((innerWidth - raw.length) / 2));
    const rightSpaces = Math.max(0, innerWidth - raw.length - leftSpaces);
    out.push(' '.repeat(leftMargin) + side + ' '.repeat(leftSpaces) + colored + ' '.repeat(rightSpaces) + side + reset);
  }

  out.push(' '.repeat(leftMargin) + bottom);
  console.log('\n' + out.join('\n') + '\n');
}

try { printCard(); }
catch (err) {
  console.error('Render error:', err && err.message ? err.message : err);
  process.exit(1);
}