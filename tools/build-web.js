// Copies the game's web files into www/, the folder Capacitor packs into the iOS and Android apps.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
const ITEMS = ['index.html', 'manifest.webmanifest', 'css', 'js', 'art', 'icons'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const item of ITEMS) fs.cpSync(path.join(root, item), path.join(out, item), { recursive: true });
console.log(`www/ ready (${ITEMS.join(', ')})`);
