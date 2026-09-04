const fs = require('fs');
const p = 'app/inCommonApp v2.dc.html';
let s = fs.readFileSync(p, 'utf8');
const rep = (label, from, to) => {
  const n = s.split(from).length - 1;
  if (n !== 1) { console.error(label + ': found ' + n + ', wanted 1'); process.exit(1); }
  s = s.split(from).join(to);
  console.log('  ok  ' + label);
};

/* ---- the privacy toast, five identical closes ---- */
rep('journal entry toast',
  "'Saved to your journal. It stays private until journal memory is on.');\n      this.setState({ jDraft: ''",
  "'Saved to your journal. Nobody reads it while journal memory is off.');\n      this.setState({ jDraft: ''");
rep('sighting toast',
  "'Kept. It is on your Throughline now.' : 'Kept in your journal. It stays private until journal memory is on.'",
  "'Kept. It is on your Throughline now.' : 'Kept in your journal, and nowhere else while journal memory is off.'");
rep('month reading toast',
  "'Kept. The reading is on your Throughline.' : 'Kept in your journal. It stays private until journal memory is on.'",
  "'Kept. The reading is on your Throughline.' : 'Kept in your journal. The reading stays on this device until journal memory is on.'");
rep('dream toast',
  "'Kept. The dream is on your Throughline.' : 'Kept in your journal. It stays private until journal memory is on.'",
  "'Kept. The dream is on your Throughline.' : 'Kept in your journal. The dream goes no further while journal memory is off.'");

/* ---- the no-contact line, four identical openings ---- */
rep('transit headline',
  "', and nothing of yours sits within three degrees of it. So it reads as the season\u2019s headline rather than as your own.'",
  "', and no placement of yours falls inside three degrees of it. So it reads as the season\u2019s headline rather than as your own.'");
rep('month no contact',
  "'Nothing of yours sits within three degrees of it, so it belongs to everybody and to nobody in particular.'",
  "'No point in your chart lies within three degrees, so this one belongs to everybody and to nobody in particular.'");
rep('today no contact',
  "'Nothing of yours sits within three degrees of it, so it is the season\u2019s headline rather than a contact with your chart.'",
  "'Your chart keeps its distance from it, more than three degrees, so this is the season talking rather than a contact of yours.'");

fs.writeFileSync(p, s);
console.log('\nrepeats varied');
