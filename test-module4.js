#!/usr/bin/env node
/**
 * 模块四单元测试 — HTML 回写
 * 覆盖 6 种典型 head 结构
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ── 从 generate.js 提取三个纯函数（不启动 Puppeteer）──────────
// 直接内联，保持与 generate.js 完全一致
const OG_URL = 'https://cdn.example.com/og/particle-bg-og.webp';

function rewriteHtmlMeta(html, ogImageUrl) {
  const ogTags = [
    `<meta property="og:image" content="${ogImageUrl}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
  ].join('\n    ');

  let result = html
    .replace(/<meta\s[^>]*property=["']og:image["'][^>]*\/?>/gi, '')
    .replace(/<meta\s[^>]*property=["']og:image:width["'][^>]*\/?>/gi, '')
    .replace(/<meta\s[^>]*property=["']og:image:height["'][^>]*\/?>/gi, '');

  result = result.replace(/\n{3,}/g, '\n\n');

  if (result.includes('</head>')) {
    result = result.replace('</head>', `    ${ogTags}\n</head>`);
  } else {
    result += `\n${ogTags}\n`;
  }
  return result;
}

function rewriteJsonLd(html, ogImageUrl) {
  const jsonLdRe = /(<script\s[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi;
  return html.replace(jsonLdRe, (match, open, content, close) => {
    let obj;
    try { obj = JSON.parse(content.trim()); } catch (_) { return match; }
    obj.image = ogImageUrl;
    return `${open}\n${JSON.stringify(obj, null, 2)}\n${close}`;
  });
}

function injectNoindex(html) {
  const hasRobots = /<meta\s[^>]*name=["']robots["'][^>]*>/i.test(html);
  if (hasRobots) return html;
  const tag = `<meta name="robots" content="noindex, nofollow">`;
  if (html.includes('</head>')) {
    return html.replace('</head>', `    ${tag}\n</head>`);
  }
  return html + `\n${tag}\n`;
}

// ── 测试框架 ───────────────────────────────────────────────
let passed = 0, failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? '\n     ' + detail : ''}`);
    failed++;
  }
}

function assertContains(label, html, needle) {
  assert(label, html.includes(needle), `期望包含：${needle.slice(0, 80)}`);
}
function assertNotContains(label, html, needle) {
  assert(label, !html.includes(needle), `期望不含：${needle.slice(0, 80)}`);
}

// ── 测试用例 ───────────────────────────────────────────────

console.log('\n📋 模块四单元测试 — HTML 回写\n');

// ─────────────────────────────────────────
// Case 1: 干净的 HTML，无任何 og/robots meta
// ─────────────────────────────────────────
console.log('Case 1: 干净 HTML（无 og meta，无 robots，无 JSON-LD）');
{
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test</title>
</head>
<body><p>hello</p></body>
</html>`;

  let out = rewriteHtmlMeta(html, OG_URL);
  assertContains('og:image 已注入',        out, `property="og:image" content="${OG_URL}"`);
  assertContains('og:image:width 已注入',  out, 'property="og:image:width" content="1200"');
  assertContains('og:image:height 已注入', out, 'property="og:image:height" content="630"');
  assert('注入位置在 </head> 前', out.indexOf('og:image') < out.indexOf('</head>'));

  out = rewriteJsonLd(out, OG_URL);
  assertNotContains('无 JSON-LD 时原样保留', out, '"image"');

  out = injectNoindex(out);
  assertContains('noindex 已注入', out, 'content="noindex, nofollow"');
  assert('noindex 在 </head> 前', out.indexOf('noindex') < out.indexOf('</head>'));
}

// ─────────────────────────────────────────
// Case 2: 已有旧的 og:image，需替换
// ─────────────────────────────────────────
console.log('\nCase 2: 已有旧 og:image（替换场景）');
{
  const oldUrl = 'https://old.example.com/old-og.jpg';
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta property="og:image" content="${oldUrl}">
  <meta property="og:image:width" content="800">
  <meta property="og:image:height" content="400">
  <title>Test</title>
</head>
<body></body>
</html>`;

  const out = rewriteHtmlMeta(html, OG_URL);
  assertContains('新 og:image 已写入',  out, `content="${OG_URL}"`);
  assertNotContains('旧 URL 已移除',    out, oldUrl);
  assertContains('新 width=1200',       out, 'content="1200"');
  assertContains('新 height=630',       out, 'content="630"');
  assertNotContains('旧 width 已移除',  out, 'content="800"');
  assertNotContains('旧 height 已移除', out, 'content="400"');
  // 不能出现重复的 og:image
  const count = (out.match(/property="og:image"/g) || []).length;
  assert(`og:image 只出现 1 次（实际 ${count} 次）`, count === 1);
}

// ─────────────────────────────────────────
// Case 3: 有 JSON-LD，更新 image 字段
// ─────────────────────────────────────────
console.log('\nCase 3: JSON-LD 存在时更新 image 字段');
{
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Effect</title>
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Particle BG",
  "image": "https://old.example.com/old.jpg",
  "programmingLanguage": "HTML"
}
  </script>
</head>
<body></body>
</html>`;

  const out = rewriteJsonLd(html, OG_URL);
  assertContains('JSON-LD image 已更新为新 URL', out, `"image": "${OG_URL}"`);
  assertNotContains('旧 image URL 已移除',       out, 'old.jpg');
  assertContains('其他 JSON-LD 字段保留',        out, '"programmingLanguage": "HTML"');
  // 确认 JSON 仍可解析
  const match = out.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  let parseable = false;
  try { JSON.parse(match[1].trim()); parseable = true; } catch (_) {}
  assert('回写后 JSON-LD 仍可解析', parseable);
}

// ─────────────────────────────────────────
// Case 4: JSON-LD 中无 image 字段（新增）
// ─────────────────────────────────────────
console.log('\nCase 4: JSON-LD 中无 image 字段（新增）');
{
  const html = `<!DOCTYPE html>
<html>
<head>
  <script type="application/ld+json">{"@type":"SoftwareSourceCode","name":"Demo"}</script>
</head>
<body></body>
</html>`;

  const out = rewriteJsonLd(html, OG_URL);
  assertContains('image 字段已新增', out, `"image": "${OG_URL}"`);
}

// ─────────────────────────────────────────
// Case 5: 已有 robots meta，noindex 不重复注入
// ─────────────────────────────────────────
console.log('\nCase 5: 已有 robots meta（不重复注入）');
{
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="robots" content="index, follow">
  <title>Test</title>
</head>
<body></body>
</html>`;

  const out = injectNoindex(html);
  // 保留原有 robots，不新增 noindex
  assertContains('原有 robots 保留',       out, 'content="index, follow"');
  assertNotContains('noindex 未被注入',    out, 'noindex, nofollow');
  const count = (out.match(/<meta\s[^>]*name="robots"/gi) || []).length;
  assert(`robots meta 只有 1 个（实际 ${count} 个）`, count === 1);
}

// ─────────────────────────────────────────
// Case 6: 单引号属性 + 自闭合 <meta /> 风格
// ─────────────────────────────────────────
console.log('\nCase 6: 单引号属性 + 自闭合 <meta /> 风格');
{
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta property='og:image' content='https://old.com/img.jpg' />
  <meta property='og:image:width' content='900' />
  <meta property='og:image:height' content='500' />
  <title>Test</title>
</head>
<body></body>
</html>`;

  const out = rewriteHtmlMeta(html, OG_URL);
  assertContains('新 og:image 写入（双引号规范化）', out, `content="${OG_URL}"`);
  assertNotContains('旧单引号 URL 已清除', out, 'old.com/img.jpg');
  assertNotContains('旧 width 900 已清除', out, "content='900'");
}

// ─────────────────────────────────────────
// Case 7: 端到端 — 写入真实文件再验证
// ─────────────────────────────────────────
console.log('\nCase 7: 端到端 — 写入真实临时文件再读取验证');
{
  const tmpPath = path.join(os.tmpdir(), `heg-test-${Date.now()}.html`);
  const original = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Live Test</title>
  <script type="application/ld+json">{"@type":"SoftwareSourceCode","name":"Live"}</script>
</head>
<body><canvas></canvas></body>
</html>`;

  fs.writeFileSync(tmpPath, original, 'utf8');

  // 模拟 rewriteHtml 流程
  let html = fs.readFileSync(tmpPath, 'utf8');
  html = rewriteHtmlMeta(html, OG_URL);
  html = rewriteJsonLd(html, OG_URL);
  html = injectNoindex(html);
  fs.writeFileSync(tmpPath, html, 'utf8');

  const result = fs.readFileSync(tmpPath, 'utf8');
  fs.unlinkSync(tmpPath);

  assertContains('文件内含 og:image',    result, `content="${OG_URL}"`);
  assertContains('文件内含 og:width',    result, 'content="1200"');
  assertContains('文件内含 og:height',   result, 'content="630"');
  assertContains('文件内含 noindex',     result, 'noindex, nofollow');
  assertContains('文件内含 JSON-LD img', result, `"image": "${OG_URL}"`);
  assertContains('原始内容保留',         result, '<canvas></canvas>');
}

// ─────────────────────────────────────────
// 汇总
// ─────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`📊 测试结果：✅ ${passed} 通过  ❌ ${failed} 失败`);
if (failed > 0) process.exit(1);
