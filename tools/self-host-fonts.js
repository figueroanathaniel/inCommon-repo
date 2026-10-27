#!/usr/bin/env node
// tools/self-host-fonts.js
import fs from 'fs';
const FONTS_DIR = 'app/fonts';
const files = fs.readdirSync(FONTS_DIR).filter(f => f.endsWith('.woff2'));
let css = '/* Self-hosted - replaces Google Fonts CDN */\n';
for (const f of files) {
  const m = f.match(/([a-z-]+)-v\d+-latin-(\d+)/i);
  const family = m ? m[1] : f.split('-')[0];
  const weight = m ? m[2] : '400';
  const style = f.includes('italic') ? 'italic' : 'normal';
  css += `
@font-face {
  font-family: '${family}';
  src: url('./fonts/${f}') format('woff2');
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
  unicode-range: U+0020-00FF;
}
`;
}
fs.writeFileSync(FONTS_DIR + '.css', css);
console.log('Generated', FONTS_DIR + '.css', 'from', files.length, 'files');
