#!/usr/bin/env node

/**
 * generate.js — HTML Effects Gallery 自动化流水线
 *
 * 用法:
 *   node generate.js              # 全量处理 demos/ 下所有 HTML
 *   node generate.js --new        # 只处理 demos/ 下新增（demos/done/ 没有对应记录的）
 *   node generate.js --file x.html  # 处理单个文件
 *
 * 依赖:
 *   npm install puppeteer @aws-sdk/client-s3 slugify dotenv node-fetch
 *   系统须安装 ffmpeg
 *
 * 环境变量 (.env):
 *   R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
 *   R2_BUCKET=uimaster-effects
 *   R2_ACCESS_KEY_ID=
 *   R2_SECRET_ACCESS_KEY=
 *   R2_PUBLIC_URL=https://cdn.uimaster.cc
 *   CF_ACCOUNT_ID=
 *   CF_API_TOKEN=
 *   CF_D1_DATABASE_ID=
 *   AI_API_KEY=                    # Anthropic / OpenAI key
 *   AI_PROVIDER=anthropic          # anthropic | openai
 */

import 'dotenv/config';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import slugify from 'slugify';
import puppeteer from 'puppeteer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ────────────────────────────────────────────────────────────────

const DEMOS_DIR = path.join(__dirname, 'demos');
const DONE_DIR = path.join(__dirname, 'demos', 'done');
const COVERS_DIR = path.join(__dirname, 'covers');
const OG_TEMPLATE = path.join(__dirname, 'og-template.html');

const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const R2_BUCKET = process.env.R2_BUCKET || 'uimaster-effects';
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

// ─── Entry point ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);

async function main() {
  await fsp.mkdir(DONE_DIR, { recursive: true });
  await fsp.mkdir(COVERS_DIR, { recursive: true });

  const files = await resolveTargetFiles(args);

  if (files.length === 0) {
    console.log('No HTML files to process.');
    return;
  }

  console.log(`\n🚀 Processing ${files.length} file(s)...\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const file of files) {
    try {
      await processFile(file, browser);
    } catch (err) {
      console.error(`❌ Failed: ${path.basename(file)}\n`, err.message);
    }
  }

  await browser.close();
  console.log('\n✅ Pipeline complete.\n');
}

// ─── File resolution ───────────────────────────────────────────────────────

async function resolveTargetFiles(args) {
  const fileFlag = args.indexOf('--file');
  if (fileFlag !== -1) {
    const name = args[fileFlag + 1];
    if (!name) throw new Error('--file requires a filename');
    const full = path.isAbsolute(name) ? name : path.join(DEMOS_DIR, name);
    if (!fs.existsSync(full)) throw new Error(`File not found: ${full}`);
    return [full];
  }

  // All HTML files directly in demos/ (not in subdirs)
  const all = (await fsp.readdir(DEMOS_DIR))
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(DEMOS_DIR, f));

  if (args.includes('--new')) {
    // "New" = file not already in demos/done/
    const done = new Set(
      (await fsp.readdir(DONE_DIR)).map(f => f)
    );
    return all.filter(f => !done.has(path.basename(f)));
  }

  return all;
}

// ─── Main pipeline per file ────────────────────────────────────────────────

async function processFile(filePath, browser) {
  const fileName = path.basename(filePath, '.html');
  const id = toSlug(fileName);
  const htmlContent = await fsp.readFile(filePath, 'utf-8');

  console.log(`\n── ${fileName} (id: ${id})`);

  // 1. Parse basic metadata from filename / HTML
  const meta = parseMetadata(fileName, htmlContent);

  // 2. Record cover paths
  const coverWebp = path.join(COVERS_DIR, `${id}.webp`);
  const coverStatic = path.join(COVERS_DIR, `${id}-static.webp`);
  const ogImage = path.join(COVERS_DIR, `${id}-og.webp`);

  // 3. Generate animated cover (Puppeteer → frames → ffmpeg)
  console.log('  📸 Recording cover...');
  await recordCover(filePath, coverWebp, coverStatic, browser);

  // 4. Generate OG Image
  console.log('  🖼  Generating OG image...');
  const aiDescription = await generateDescription(meta, htmlContent);
  await renderOgImage(meta, aiDescription, coverStatic, ogImage, browser);

  // 5. Upload to R2
  console.log('  ☁️  Uploading to R2...');
  const [coverUrl, coverStaticUrl, ogImageUrl, sourceUrl] = await Promise.all([
    uploadR2(coverWebp, `covers/${id}.webp`, 'image/webp'),
    uploadR2(coverStatic, `covers/${id}-static.webp`, 'image/webp'),
    uploadR2(ogImage, `og/${id}-og.webp`, 'image/webp'),
    // Upload the (soon-to-be-rewritten) HTML
    Promise.resolve(null), // placeholder, upload after rewrite
  ]);

  // 6. Rewrite HTML (inject og:image + noindex)
  console.log('  ✏️  Rewriting HTML...');
  const rewrittenHtml = injectMeta(htmlContent, ogImageUrl);
  const tempHtmlPath = path.join(COVERS_DIR, `${id}.html`);
  await fsp.writeFile(tempHtmlPath, rewrittenHtml, 'utf-8');
  const finalSourceUrl = await uploadR2(tempHtmlPath, `effects/${id}.html`, 'text/html');

  // 7. Write to D1
  console.log('  🗄  Writing to D1...');
  const record = {
    id,
    title: meta.title,
    description: aiDescription,
    category: meta.category,
    scene: meta.scene,
    tags: JSON.stringify(meta.tags),
    source_url: finalSourceUrl,
    cover_url: coverUrl,
    cover_static_url: coverStaticUrl,
    og_image_url: ogImageUrl,
    date: new Date().toISOString().split('T')[0],
    is_featured: 0,
    view_count: 0,
    export_count: 0,
    share_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await writeD1(record);

  // 8. Move to done/
  const destPath = path.join(DONE_DIR, path.basename(filePath));
  await fsp.rename(filePath, destPath);
  console.log(`  ✅ Done → demos/done/${path.basename(filePath)}`);
}

// ─── Metadata parsing ──────────────────────────────────────────────────────

function parseMetadata(fileName, html) {
  // Derive title from filename: "particle-galaxy-canvas" → "Particle Galaxy Canvas"
  const title = fileName
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  // Detect category from filename / HTML content
  const lower = (fileName + ' ' + html).toLowerCase();
  let category = 'css-animation';
  if (lower.includes('canvas')) category = 'canvas';
  else if (lower.includes('webgl') || lower.includes('three.js') || lower.includes('threejs')) category = 'webgl';
  else if (lower.includes('svg')) category = 'svg';
  else if (lower.includes('css') || lower.includes('animation') || lower.includes('keyframe')) category = 'css-animation';

  // Detect scene
  let scene = 'landing-page';
  if (lower.includes('background')) scene = 'background';
  else if (lower.includes('loader') || lower.includes('loading')) scene = 'loader';
  else if (lower.includes('hero')) scene = 'hero';
  else if (lower.includes('banner')) scene = 'banner';
  else if (lower.includes('card')) scene = 'card';

  // Extract technical tags
  const tagMap = {
    canvas: 'canvas',
    webgl: 'webgl',
    'three.js': 'three.js',
    particle: 'particles',
    glsl: 'glsl',
    shader: 'shader',
    svg: 'svg',
    gsap: 'gsap',
    'css animation': 'css-animation',
    keyframe: 'keyframes',
    gradient: 'gradient',
  };
  const tags = Object.entries(tagMap)
    .filter(([k]) => lower.includes(k))
    .map(([, v]) => v);

  return { title, category, scene, tags };
}

// ─── Cover recording ───────────────────────────────────────────────────────

async function recordCover(filePath, outWebp, outStatic, browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 640, height: 400 });

  const url = `file://${filePath}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  // Give animations 500ms to start
  await page.waitForTimeout(500);

  const framesDir = path.join(COVERS_DIR, `frames_${path.basename(filePath, '.html')}`);
  await fsp.mkdir(framesDir, { recursive: true });

  // Capture ~2 seconds at ~12fps = ~24 frames
  const FRAME_COUNT = 24;
  const FRAME_DELAY = 80; // ms

  const framePaths = [];
  for (let i = 0; i < FRAME_COUNT; i++) {
    const framePath = path.join(framesDir, `frame${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: framePath });
    framePaths.push(framePath);
    await page.waitForTimeout(FRAME_DELAY);
  }

  await page.close();

  // Extract static (first frame) as WebP
  try {
    execSync(`ffmpeg -y -i "${framePaths[0]}" "${outStatic}" 2>/dev/null`);
  } catch {
    // Fallback: copy the PNG as-is and rename
    await fsp.copyFile(framePaths[0], outStatic.replace('.webp', '.png'));
    console.warn('  ⚠️  ffmpeg failed for static cover, using PNG fallback');
  }

  // Compose animated WebP from frames
  try {
    const framePattern = path.join(framesDir, 'frame%04d.png');
    execSync(
      `ffmpeg -y -framerate 12 -i "${framePattern}" -loop 0 -c:v libwebp -lossless 0 -compression_level 6 -q:v 80 "${outWebp}" 2>/dev/null`
    );
  } catch {
    // Fallback: use the static cover
    await fsp.copyFile(outStatic, outWebp);
    console.warn('  ⚠️  ffmpeg animated WebP failed, using static fallback');
  }

  // Cleanup frames
  await fsp.rm(framesDir, { recursive: true, force: true });
}

// ─── OG Image rendering ────────────────────────────────────────────────────

async function renderOgImage(meta, description, coverStaticPath, outWebp, browser) {
  let templateHtml = await fsp.readFile(OG_TEMPLATE, 'utf-8');

  // Inject values into template
  const coverDataUrl = await toDataUrl(coverStaticPath);
  templateHtml = templateHtml
    .replace('__COVER_STATIC_URL__', coverDataUrl)
    .replace('__CATEGORY__', escapeHtml(meta.category))
    .replace('__TITLE__', escapeHtml(meta.title))
    .replace('__DESCRIPTION__', escapeHtml(description.slice(0, 180)));

  // Inject tags
  const tagsHtml = meta.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  templateHtml = templateHtml.replace('<!-- Tags injected by generate.js -->', tagsHtml);

  // Write temp template
  const tempPath = path.join(COVERS_DIR, `og-tmp-${Date.now()}.html`);
  await fsp.writeFile(tempPath, templateHtml, 'utf-8');

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  await page.goto(`file://${tempPath}`, { waitUntil: 'networkidle0', timeout: 15000 });

  const screenshotBuffer = await page.screenshot({ type: 'webp', quality: 90 });
  await fsp.writeFile(outWebp, screenshotBuffer);
  await page.close();

  // Cleanup temp
  await fsp.unlink(tempPath).catch(() => {});
}

// ─── AI description generation ─────────────────────────────────────────────

async function generateDescription(meta, html) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    console.warn('  ⚠️  No AI_API_KEY set, using placeholder description');
    return `A stunning ${meta.category} HTML effect titled "${meta.title}". Perfect for ${meta.scene} use cases. Uses ${meta.tags.join(', ') || 'modern web'} techniques. Free to use and customise.`;
  }

  const provider = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();
  const prompt = `Write a concise 150-200 word description for an HTML web effect called "${meta.title}".
Category: ${meta.category}
Scene/use case: ${meta.scene}
Tech tags: ${meta.tags.join(', ')}

The description should:
- Start with the visual effect itself (what it looks like)
- Explain what it's good for (use cases)
- Mention the techniques used
- Be written for a developer audience
- Avoid hype words like "stunning", "amazing", "incredible"
- Be factual and informative

Return only the description, no preamble.`;

  try {
    if (provider === 'anthropic') {
      const { default: fetch } = await import('node-fetch');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      return data.content?.[0]?.text?.trim() || 'No description generated.';
    } else if (provider === 'openai') {
      const { default: fetch } = await import('node-fetch');
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || 'No description generated.';
    }
  } catch (err) {
    console.warn('  ⚠️  AI description failed:', err.message);
  }

  return `A ${meta.category} HTML effect for ${meta.scene} use cases.`;
}

// ─── HTML rewriting ────────────────────────────────────────────────────────

function injectMeta(html, ogImageUrl) {
  const noindexMeta = `<meta name="robots" content="noindex, nofollow">`;
  const ogMeta = `<meta property="og:image" content="${ogImageUrl}">`;

  // If <head> exists, inject after opening tag
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/(<head[^>]*>)/i, `$1\n  ${noindexMeta}\n  ${ogMeta}`);
  }

  // No <head>: prepend to document
  return `<head>\n  ${noindexMeta}\n  ${ogMeta}\n</head>\n` + html;
}

// ─── R2 upload ─────────────────────────────────────────────────────────────

async function uploadR2(localPath, r2Key, contentType) {
  const fileBuffer = await fsp.readFile(localPath);

  await R2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  const publicUrl = `${R2_PUBLIC_URL}/${r2Key}`;
  console.log(`    → ${publicUrl}`);
  return publicUrl;
}

// ─── D1 write ──────────────────────────────────────────────────────────────

async function writeD1(record) {
  const accountId = process.env.CF_ACCOUNT_ID;
  const apiToken = process.env.CF_API_TOKEN;
  const dbId = process.env.CF_D1_DATABASE_ID;

  if (!accountId || !apiToken || !dbId) {
    console.warn('  ⚠️  D1 env vars missing — skipping DB write. Set CF_ACCOUNT_ID, CF_API_TOKEN, CF_D1_DATABASE_ID.');
    return;
  }

  const sql = `
    INSERT INTO html_effects (
      id, title, description, category, scene, tags,
      source_url, cover_url, cover_static_url, og_image_url,
      date, is_featured, view_count, export_count, share_count,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      category = excluded.category,
      scene = excluded.scene,
      tags = excluded.tags,
      source_url = excluded.source_url,
      cover_url = excluded.cover_url,
      cover_static_url = excluded.cover_static_url,
      og_image_url = excluded.og_image_url,
      updated_at = excluded.updated_at
  `;

  const params = [
    record.id,
    record.title,
    record.description,
    record.category,
    record.scene,
    record.tags,
    record.source_url,
    record.cover_url,
    record.cover_static_url,
    record.og_image_url,
    record.date,
    record.is_featured,
    record.view_count,
    record.export_count,
    record.share_count,
    record.created_at,
    record.updated_at,
  ];

  const { default: fetch } = await import('node-fetch');
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ sql, params }),
    }
  );

  const data = await res.json();
  if (!data.success) {
    throw new Error(`D1 write failed: ${JSON.stringify(data.errors)}`);
  }

  console.log('    → D1 record written');
}

// ─── Utilities ─────────────────────────────────────────────────────────────

function toSlug(name) {
  return slugify(name, { lower: true, strict: true });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function toDataUrl(imagePath) {
  try {
    const buf = await fsp.readFile(imagePath);
    const ext = path.extname(imagePath).slice(1).replace('jpg', 'jpeg');
    return `data:image/${ext};base64,${buf.toString('base64')}`;
  } catch {
    // Image not yet available (e.g. cover generation failed)
    return '';
  }
}

// ─── Run ───────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});