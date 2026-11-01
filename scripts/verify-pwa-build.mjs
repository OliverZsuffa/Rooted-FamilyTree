import { access, readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
const html = await readFile('dist/index.html', 'utf8');

if (manifest.start_url !== './' || manifest.scope !== './') {
  throw new Error('The PWA manifest must use a relative start URL and scope for the GitHub Pages project path.');
}
if (!Array.isArray(manifest.icons) || !manifest.icons.some((icon) => icon.src.endsWith('rooted.svg'))) {
  throw new Error('The PWA manifest does not reference the local Rooted icon.');
}
if (!html.includes('/Rooted-FamilyTree/') || !html.includes('./rooted.svg')) {
  throw new Error('The production HTML does not contain the expected GitHub Pages base path and local favicon.');
}

await Promise.all(['dist/sw.js', 'dist/rooted.svg'].map((path) => access(path)));
console.log('PWA build verified: project path, manifest, service worker, and local icon are present.');
