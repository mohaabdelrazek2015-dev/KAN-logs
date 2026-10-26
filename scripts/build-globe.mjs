// Builds src/data/land-dots.json (land points for the globe) from Natural Earth data.
// node scripts/build-globe.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { geoContains } from 'd3-geo';
import { feature } from 'topojson-client';

const root = resolve(import.meta.dirname, '..');
const world = JSON.parse(readFileSync(resolve(root, 'node_modules/world-atlas/land-110m.json'), 'utf8'));
const land = feature(world, world.objects.land);

const STEP = 1.6; // degrees between rows
const dots = [];
for (let lat = -58; lat <= 78; lat += STEP) {
  const lngStep = STEP / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  for (let lng = -180; lng < 180; lng += lngStep) {
    if (geoContains(land, [lng, lat])) dots.push(Math.round(lat * 10), Math.round(lng * 10));
  }
}
writeFileSync(resolve(root, 'src/data/land-dots.json'), JSON.stringify(dots));
console.log(`${dots.length / 2} land dots`);
