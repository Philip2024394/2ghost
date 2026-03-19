/**
 * 2Ghost — Mock Profile Image Uploader
 * ─────────────────────────────────────
 * Uploads PNG/JPG files from a local folder to Supabase Storage (ghost-images bucket),
 * then prints the updated image URL map so you can paste it into indonesianProfiles.ts.
 *
 * Usage:
 *   1. Drop your PNG files into  scripts/profile-images/
 *      Name them by gender + index so they map cleanly, e.g.:
 *        female-1.png  female-2.png  ...  female-40.png
 *        male-1.png    male-2.png    ...  male-20.png
 *      OR just any name — the script uploads all images and lists their URLs.
 *
 *   2. Run:  node scripts/upload-mock-profiles.mjs
 *
 *   3. Copy the printed URL map into indonesianProfiles.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { extname, basename, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Credentials ──────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://czlfqasujfdfumelzjbp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bGZxYXN1amZkZnVtZWx6amJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTI0MjgsImV4cCI6MjA4OTQ4ODQyOH0.3upnz58ztRJcJ2Tk9nngTBezX6Zn9N2labFqkdyHa8I';
const BUCKET    = 'ghost-images';
const FOLDER    = 'mock-profiles';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Image folder ─────────────────────────────────────────────────────────────
const IMAGE_DIR = join(__dirname, 'profile-images');
const ALLOWED   = new Set(['.png', '.jpg', '.jpeg', '.webp']);

// ── Upload ───────────────────────────────────────────────────────────────────
async function run() {
  let files;
  try {
    files = await readdir(IMAGE_DIR);
  } catch {
    console.error(`\n❌  Folder not found: ${IMAGE_DIR}`);
    console.error(`    Create it and drop your PNG files inside, then re-run.\n`);
    process.exit(1);
  }

  const images = files.filter(f => ALLOWED.has(extname(f).toLowerCase())).sort();

  if (images.length === 0) {
    console.error(`\n❌  No PNG/JPG files found in ${IMAGE_DIR}\n`);
    process.exit(1);
  }

  console.log(`\n📤  Uploading ${images.length} image(s) to Supabase Storage...\n`);

  const results = [];

  for (const filename of images) {
    const filePath   = join(IMAGE_DIR, filename);
    const storagePath = `${FOLDER}/${filename}`;
    const mimeType   = extname(filename).toLowerCase() === '.png' ? 'image/png'
                     : extname(filename).toLowerCase() === '.webp' ? 'image/webp'
                     : 'image/jpeg';

    const data = await readFile(filePath);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, data, {
        contentType: mimeType,
        upsert: true,       // overwrite if already exists
      });

    if (error) {
      console.error(`  ✗  ${filename}  →  ${error.message}`);
      results.push({ filename, url: null, error: error.message });
      continue;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const url = urlData.publicUrl;
    console.log(`  ✓  ${filename}`);
    console.log(`     ${url}\n`);
    results.push({ filename, url });
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const ok     = results.filter(r => r.url);
  const failed = results.filter(r => !r.url);

  console.log('─'.repeat(60));
  console.log(`✅  ${ok.length} uploaded   ❌  ${failed.length} failed\n`);

  if (ok.length === 0) {
    console.log('Nothing to map. Check errors above.');
    return;
  }

  // ── Print URL map for copy-paste into code ────────────────────────────────
  console.log('// ── Paste this into indonesianProfiles.ts ───────────────');
  console.log('const MOCK_PROFILE_IMAGES: Record<string, string> = {');
  for (const { filename, url } of ok) {
    const key = basename(filename, extname(filename));
    console.log(`  "${key}": "${url}",`);
  }
  console.log('};\n');

  // Separate female / male arrays for easy drop-in
  const females = ok.filter(r => basename(r.filename, extname(r.filename)).toLowerCase().startsWith('female'));
  const males   = ok.filter(r => basename(r.filename, extname(r.filename)).toLowerCase().startsWith('male'));

  if (females.length > 0) {
    console.log('// Female image URLs (in order):');
    console.log('const FEMALE_IMAGES = [');
    females.forEach(r => console.log(`  "${r.url}",`));
    console.log('];\n');
  }

  if (males.length > 0) {
    console.log('// Male image URLs (in order):');
    console.log('const MALE_IMAGES = [');
    males.forEach(r => console.log(`  "${r.url}",`));
    console.log('];\n');
  }
}

run().catch(err => {
  console.error('\n💥  Unexpected error:', err.message);
  process.exit(1);
});
