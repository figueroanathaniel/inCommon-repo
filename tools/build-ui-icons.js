#!/usr/bin/env node
/* build-ui-icons.js: the app's own icon set, drawn in the identity's grammar.
 *
 * THE GRAMMAR, taken from the mark and from what the app is for.
 *
 * The mark is two circles and the lens they share. It says one thing: a whole
 * is a whole, and what two of them have in common is a third thing that belongs
 * to neither alone. That is also the argument the app makes about a birth chart,
 * a number and a design, so the icon set is built from the same two moves.
 *
 *   A CIRCLE IS A WHOLE.        A person, a day, a body, a self.
 *   THE LENS IS WHAT IS SHARED. Never decoration. It appears only where the
 *                               screen is genuinely about an overlap.
 *
 * Which is why these are not the usual set. Settings is not a gear, because
 * nothing here is machinery: it is two circles on a track, one filled, because
 * every switch in that screen is a consent. Search is the one exception, drawn
 * as the magnifier people already know, because a search icon is looked for
 * rather than studied. Throughline is a line with three moments on it, the middle one
 * lensed, because the screen is a record rather than a score. Get Help is two
 * circles leaning together with the overlap solid, because the copy on that
 * screen says you deserve a person and the icon should not say otherwise.
 *
 * MONOCHROME, ON PURPOSE. These ship as masks: the shape comes from here and
 * the colour from whatever the nav is already using for active and resting.
 * The two-colour treatment stays with the brand mark, where the green means
 * something. An icon set that repeated it everywhere would spend the one
 * colour the app reserves for what is shared.
 *
 * GEOMETRY. A 24 box, circles of r 7 with centres 3.5 either side of the
 * middle, so d equals r and the overlap is the true vesica of the mark rather
 * than an approximation of it. Strokes are 1.7, which holds at the 20px the
 * vertical nav draws them at.
 *
 * Usage: node tools/build-ui-icons.js
 *   Writes the standalone set into "inCommon Logo/icons" and prints the data
 *   URI table for the app to paste into ICONS.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const OUT = path.join(repo, 'inCommon Logo', 'icons');

/* the vesica of the mark, at r=7 with centres 3.5 either side of 12 */
const R = 7, DX = 3.5, HALF = (R * Math.sqrt(3) / 2).toFixed(2);   /* 6.06 */
const LENS = 'M12 ' + (12 - HALF) + 'A' + R + ' ' + R + ' 0 0 1 12 ' + (12 - -HALF) +
             'A' + R + ' ' + R + ' 0 0 1 12 ' + (12 - HALF) + 'Z';

/* a smaller lens, for icons that carry it as a detail rather than a subject */
function lensAt(cx, cy, r) {
  const h = (r * Math.sqrt(3) / 2);
  return 'M' + cx + ' ' + (cy - h).toFixed(2) + 'A' + r + ' ' + r + ' 0 0 1 ' + cx + ' ' + (cy + h).toFixed(2) +
         'A' + r + ' ' + r + ' 0 0 1 ' + cx + ' ' + (cy - h).toFixed(2) + 'Z';
}

const S = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
const F = 'fill="currentColor"';

const ICONS = {
  /* TODAY. One whole, the day, and the part of it that is yours. */
  today:
    '<circle cx="12" cy="12" r="8.6" ' + S + '/>' +
    '<path d="' + lensAt(12, 12, 3.6) + '" ' + F + '/>',

  /* MY CHARTS. The wheel: a rim, the houses cut into it, and a centre that is
     the chart owner rather than an ornament. */
  spirit:
    '<circle cx="12" cy="12" r="8.6" ' + S + '/>' +
    '<circle cx="12" cy="12" r="3.4" ' + S + '/>' +
    '<path d="M12 3.4v3.2M12 17.4v3.2M3.4 12h3.2M17.4 12h3.2" ' + S + '/>',

  /* LIBRARY. Three wholes on a shelf, the middle one open. Reference is other
     people's work, kept in order, and one of them is the one you are reading. */
  library:
    '<path d="M4.6 5.4v13.2M12 4.4v15.2M19.4 5.4v13.2" ' + S + '/>' +
    '<path d="M3 19.6h18" ' + S + '/>' +
    '<path d="' + lensAt(12, 11.6, 3.1) + '" ' + F + '/>',

  /* THROUGHLINE. A line with moments on it. The middle one is lensed because
     the entry you are standing in is the one that overlaps with now. */
  throughline:
    '<path d="M12 3.2v17.6" ' + S + '/>' +
    '<circle cx="12" cy="6.2" r="2.1" ' + S + '/>' +
    '<path d="' + lensAt(12, 12, 2.6) + '" ' + F + '/>' +
    '<circle cx="12" cy="17.8" r="2.1" ' + S + '/>',

  /* SETTINGS. Not a gear. Every control on that screen is a consent, so it is
     a switch: two positions on one track, and the filled one is the answer you
     have given. */
  settings:
    '<rect x="2.8" y="7.6" width="18.4" height="8.8" rx="4.4" ' + S + '/>' +
    '<circle cx="16.6" cy="12" r="2.5" ' + F + '/>',

  /* SEARCH. A magnifier, and not a clever one.
     The lens of the mark is geometrically a lens, which made it tempting, but
     a vesica standing where a magnifying glass belongs reads as an unfamiliar
     shape rather than as a search field. This is the one icon in the set where
     the convention outranks the grammar: people do not study a search icon,
     they look for the one they already know. The mark keeps its lens
     everywhere it is actually saying something. */
  search:
    '<circle cx="10.6" cy="10.6" r="6.4" ' + S + '/>' +
    '<path d="M15.3 15.3l5.1 5.1" ' + S + '/>',

  /* THE SUBJECTS. Each of these marks a body of material rather than a screen,
     so each says what its material is, in the same two moves.

     A note on what is NOT here. The astral body glyphs stay exactly as they are.
     The Sun beside a placement is not an icon, it is the astronomical symbol
     for the Sun, and it has meant that in every ephemeris ever printed. To
     redraw it would be to invent notation and quietly break the reader's
     ability to check the app against any other source, which is the one thing
     this app spends all its credibility on. Chrome gets redrawn. Notation does
     not. */

  /* ASTROLOGY. A wheel with one body on its rim: the sky, and your position
     in it, which is the only reason the wheel is being drawn. */
  astrology:
    '<circle cx="12" cy="12" r="8.4" ' + S + '/>' +
    '<circle cx="12" cy="3.6" r="2.1" ' + F + '/>',

  /* HUMAN DESIGN. Two centres and the channel between them. A definition is
     the connection, never either end on its own. */
  humandesign:
    '<circle cx="12" cy="5.6" r="2.9" ' + S + '/>' +
    '<circle cx="12" cy="18.4" r="2.9" ' + S + '/>' +
    '<path d="M12 8.5v7" ' + S + '/>' +
    '<path d="M8.4 12h7.2" ' + S + '/>',

  /* NUMEROLOGY. Tempo, which is what the app says a number is: three beats,
     rising, the current one filled. */
  numerology:
    '<path d="M5.4 15.8v3.4M12 11v8.2M18.6 6.2v13" ' + S + '/>' +
    '<path d="' + lensAt(12, 7.4, 2.6) + '" ' + F + '/>',

  /* TAROT. A card, and the image inside it doing the work. */
  tarot:
    '<rect x="6.2" y="3.4" width="11.6" height="17.2" rx="2.4" ' + S + '/>' +
    '<path d="' + lensAt(12, 12, 3.2) + '" ' + F + '/>',

  /* SABIAN. Three hundred and sixty degrees, marked at the quarters, with one
     of them the image being read. */
  sabian:
    '<circle cx="12" cy="12" r="8.4" ' + S + '/>' +
    '<path d="M12 3.6v2.4M12 18v2.4M3.6 12h2.4M18 12h2.4" ' + S + '/>' +
    '<path d="' + lensAt(12, 12, 3) + '" ' + F + '/>',

  /* SYNASTRY. The mark itself, with the lens drawn rather than filled. Two
     charts read side by side, and the overlap is the subject: what completes
     between two people belongs to neither of them alone. Held open rather than
     solid, because it takes both, and because it is not the same claim Get Help
     is making with the same two circles. */
  synastry:
    '<circle cx="8.6" cy="12" r="6.2" ' + S + '/>' +
    '<circle cx="15.4" cy="12" r="6.2" ' + S + '/>',

  /* ANGEL NUMBERS. A sign you keep meeting: the same stroke three times, and
     the one you finally looked up. The repetition is the whole phenomenon, and
     the app is careful to call it a prompt rather than a message. */
  angel:
    '<path d="M6.4 8v9M12 8v9M17.6 8v9" ' + S + '/>' +
    '<path d="' + lensAt(12, 5.2, 2.2) + '" ' + F + '/>',

  /* GET HELP. Two people leaning together, and the part they hold in common
     made solid. The screen it opens says you deserve a person. */
  help:
    '<circle cx="8.6" cy="12" r="6.4" ' + S + '/>' +
    '<circle cx="15.4" cy="12" r="6.4" ' + S + '/>' +
    '<path d="' + lensAt(12, 12, 6.4).replace(/A6.4 6.4/g, 'A6.4 6.4') + '" ' + F + '/>'
};

/* The help lens has to be the overlap of ITS two circles, which sit 3.4 either
   side rather than 3.5, so it is rebuilt from those instead of borrowed. */
(function fixHelp() {
  const r = 6.4, dx = 3.4, h = Math.sqrt(r * r - dx * dx);
  const p = 'M12 ' + (12 - h).toFixed(2) + 'A' + r + ' ' + r + ' 0 0 1 12 ' + (12 + h).toFixed(2) +
            'A' + r + ' ' + r + ' 0 0 1 12 ' + (12 - h).toFixed(2) + 'Z';
  ICONS.help = '<circle cx="8.6" cy="12" r="6.4" ' + S + '/>' +
               '<circle cx="15.4" cy="12" r="6.4" ' + S + '/>' +
               '<path d="' + p + '" ' + F + '/>';
})();

function svg(body, colour) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"' +
    (colour ? ' color="' + colour + '"' : '') + '>' + body + '</svg>';
}

/* A mask wants the shape only, so currentColor resolves to solid black and the
   alpha is what matters.

   Unquoted, and fully percent encoded. The value is pasted into an HTML style
   attribute that is itself delimited by double quotes, so a url("...") wrapper
   would close the attribute at its first quote and take the rest of the element
   with it. */
function dataUri(body) {
  return 'url(data:image/svg+xml,' + encodeURIComponent(svg(body, '#000')) + ')';
}

fs.mkdirSync(OUT, { recursive: true });
const table = {};
for (const id of Object.keys(ICONS)) {
  /* the standalone file keeps the violet of the mark, so the set reads as one
     family when it is looked at outside the app */
  fs.writeFileSync(path.join(OUT, id + '.svg'), svg(ICONS[id], '#8b5cf6') + '\n', 'utf8');
  table[id] = dataUri(ICONS[id]);
}

/* a contact sheet, so the set can be judged together rather than one at a time */
const sheet = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1090 200">',
  '<rect width="1090" height="200" fill="#0b0910"/>',
  '<text x="24" y="34" fill="#8b8a95" font-family="Karla, system-ui, sans-serif" font-size="12" letter-spacing="3">INCOMMON  /  UI ICON SET</text>'];
Object.keys(ICONS).forEach((id, i) => {
  const x = 30 + i * 76, y = 74;
  sheet.push('<g transform="translate(' + x + ' ' + y + ') scale(2.2)" color="#8b5cf6">' + ICONS[id] + '</g>');
  sheet.push('<text x="' + (x + 26) + '" y="' + (y + 84) + '" fill="#6f6e79" font-family="Karla, system-ui, sans-serif" ' +
    'font-size="10" text-anchor="middle">' + id + '</text>');
});
sheet.push('</svg>');
fs.writeFileSync(path.join(OUT, '_set.svg'), sheet.join('\n') + '\n', 'utf8');

fs.writeFileSync(path.join(OUT, 'icons.json'), JSON.stringify(table, null, 2) + '\n', 'utf8');
console.log('build-ui-icons: wrote ' + (Object.keys(ICONS).length + 2) + ' files into ' + OUT);
Object.keys(ICONS).forEach(id => console.log('  ' + id.padEnd(13) + ICONS[id].length + ' chars'));
