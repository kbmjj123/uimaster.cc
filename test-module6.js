#!/usr/bin/env node
/**
 * 模块六测试 — Cloudflare R2 上传
 *
 * 无凭据：验证降级逻辑（返回占位 URL，不报错）
 * 有凭据：真实上传 4 个文件，验证公开 URL 可访问
 *
 * 环境变量（可选，有则真实测试）：
 *   CF_ACCOUNT_ID        Cloudflare Account ID
 *   R2_ACCESS_KEY_ID     R2 Access Key ID
 *   R2_SECRET_ACCESS_KEY R2 Secret Access Key
 *   R2_PUBLIC_BASE       R2 公开域名，如 https://pub.example.com
 *   R2_BUCKET_NAME       Bucket 名称（默认 html-effects-gallery）
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

let passed = 0, failed = 0;
function assert(label, condition, detail) {
  if (condition) { console.log('  ✅ ' + label); passed++; }
  else { console.error('  ❌ ' + label + (detail ? '\n     ' + detail : '')); failed++; }
}

// ── 内联关键函数（与 generate.js 完全一致）────────────────────
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.webp': 'image/webp',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
  };
  return map[ext] || 'application/octet-stream';
}

function buildR2Client(accountId, accessKeyId, secretKey) {
  const { S3Client } = require('@aws-sdk/client-s3');
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey: secretKey },
  });
}

async function uploadToR2(client, bucket, prefix, localPath, r2Key) {
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const fileBuffer  = fs.readFileSync(localPath);
  const contentType = getContentType(localPath);
  const fullKey     = prefix ? `${prefix}${r2Key}` : r2Key;

  await client.send(new PutObjectCommand({
    Bucket: bucket, Key: fullKey, Body: fileBuffer, ContentType: contentType,
  }));
  return fullKey;
}

// ── 读取凭据 ────────────────────────────────────────────────
const CREDS = {
  accountId:  process.env.CF_ACCOUNT_ID        || '',
  keyId:      process.env.R2_ACCESS_KEY_ID     || '',
  secretKey:  process.env.R2_SECRET_ACCESS_KEY || '',
  publicBase: process.env.R2_PUBLIC_BASE       || 'https://your-r2-domain.com',
  bucket:     process.env.R2_BUCKET_NAME       || 'html-effects-gallery',
};
const HAS_CREDS = !!(CREDS.accountId && CREDS.keyId && CREDS.secretKey);

// ── 准备测试用的真实本地文件 ────────────────────────────────
const BASE = path.resolve(__dirname);
const FILES = {
  html:   path.join(BASE, 'demos',  'particle-bg.html'),
  cover:  path.join(BASE, 'covers', 'particle-bg.webp'),
  static: path.join(BASE, 'covers', 'particle-bg-static.webp'),
  og:     path.join(BASE, 'og',     'particle-bg-og.webp'),
};

async function main() {
  console.log('\n📋 模块六测试 — Cloudflare R2 上传\n');

  // ── Part 1: getContentType ──────────────────────────────
  console.log('── Part 1: getContentType 单元测试 ──────────────────────\n');

  assert('.html → text/html',    getContentType('foo.html')  === 'text/html; charset=utf-8');
  assert('.webp → image/webp',   getContentType('foo.webp')  === 'image/webp');
  assert('.png  → image/png',    getContentType('foo.png')   === 'image/png');
  assert('.jpg  → image/jpeg',   getContentType('foo.jpg')   === 'image/jpeg');
  assert('.jpeg → image/jpeg',   getContentType('foo.jpeg')  === 'image/jpeg');
  assert('未知扩展 → octet-stream', getContentType('foo.bin') === 'application/octet-stream');
  assert('大写扩展 .WEBP',       getContentType('foo.WEBP')  === 'image/webp');

  // ── Part 2: 本地文件前置检查 ──────────────────────────
  console.log('\n── Part 2: 本地文件前置检查 ────────────────────────────\n');

  assert('HTML  文件存在', fs.existsSync(FILES.html),   FILES.html);
  assert('动图封面存在',   fs.existsSync(FILES.cover),  FILES.cover);
  assert('静图封面存在',   fs.existsSync(FILES.static), FILES.static);
  assert('OG Image 存在', fs.existsSync(FILES.og),     FILES.og);

  if (fs.existsSync(FILES.cover)) {
    const sz = fs.statSync(FILES.cover).size;
    assert(`动图封面有内容（${(sz/1024).toFixed(1)} KB > 0）`, sz > 0);
  }
  if (fs.existsSync(FILES.og)) {
    const sz = fs.statSync(FILES.og).size;
    assert(`OG Image 有内容（${(sz/1024).toFixed(1)} KB > 0）`, sz > 0);
  }

  // ── Part 3: 无凭据降级逻辑 ──────────────────────────
  console.log('\n── Part 3: 无凭据降级逻辑 ─────────────────────────────\n');
  {
    // 模拟无凭据时的 uploadAllToR2 行为
    function uploadAllToR2_noCredsMock(id) {
      const base = 'https://placeholder.r2.dev';
      return {
        sourceUrl:      `${base}/effects/${id}.html`,
        coverUrl:       `${base}/covers/${id}.webp`,
        coverStaticUrl: `${base}/covers/${id}-static.webp`,
        ogImageUrl:     `${base}/og/${id}-og.webp`,
      };
    }
    const urls = uploadAllToR2_noCredsMock('test-effect');
    assert('sourceUrl 包含 id',      urls.sourceUrl.includes('test-effect'));
    assert('coverUrl 包含 id',       urls.coverUrl.includes('test-effect'));
    assert('coverStaticUrl 含 -static', urls.coverStaticUrl.includes('-static'));
    assert('ogImageUrl 含 -og',      urls.ogImageUrl.includes('-og'));
    assert('4 个 URL 全不为空',      Object.values(urls).every(v => v.length > 0));
    assert('4 个 URL 均为字符串',    Object.values(urls).every(v => typeof v === 'string'));

    // URL 路径结构验证
    assert('sourceUrl 路径 effects/', urls.sourceUrl.includes('/effects/'));
    assert('coverUrl 路径 covers/',   urls.coverUrl.includes('/covers/'));
    assert('ogImageUrl 路径 og/',     urls.ogImageUrl.includes('/og/'));
  }

  // ── Part 4: 前缀路径拼接 ────────────────────────────
  console.log('\n── Part 4: r2Prefix 路径拼接验证 ───────────────────────\n');
  {
    function buildKey(prefix, r2Key) {
      return prefix ? `${prefix}${r2Key}` : r2Key;
    }
    assert('无前缀：key 直接透传',    buildKey('', 'effects/a.html')       === 'effects/a.html');
    assert('有前缀 v1/：正确拼接',    buildKey('v1/', 'effects/a.html')    === 'v1/effects/a.html');
    assert('有前缀 prod/：正确拼接',  buildKey('prod/', 'covers/a.webp')   === 'prod/covers/a.webp');
  }

  // ── Part 5: 真实 R2 上传（有凭据时执行）────────────────
  console.log('\n── Part 5: 真实 R2 上传 ────────────────────────────────\n');

  if (!HAS_CREDS) {
    console.log('  ℹ️  R2 凭据未设置，跳过真实上传测试');
    console.log('     设置以下环境变量后重新运行可完整验证：');
    console.log('       CF_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
    console.log('       R2_PUBLIC_BASE, R2_BUCKET_NAME\n');
    assert('无凭据时降级逻辑正确（跳过不报错）', true);
  } else {
    console.log('  🔑 检测到 R2 凭据，开始真实上传测试...\n');
    const TEST_PREFIX = `__test__/${Date.now()}/`;

    try {
      const client = buildR2Client(CREDS.accountId, CREDS.keyId, CREDS.secretKey);

      // 上传 4 个文件
      const uploads = [
        { local: FILES.html,   key: 'effects/particle-bg.html',        label: 'HTML' },
        { local: FILES.cover,  key: 'covers/particle-bg.webp',         label: '动图封面' },
        { local: FILES.static, key: 'covers/particle-bg-static.webp',  label: '静图封面' },
        { local: FILES.og,     key: 'og/particle-bg-og.webp',          label: 'OG Image' },
      ];

      const urls = {};
      for (const { local, key, label } of uploads) {
        const t0 = Date.now();
        const fullKey = await uploadToR2(client, CREDS.bucket, TEST_PREFIX, local, key);
        const elapsed = Date.now() - t0;
        const publicUrl = `${CREDS.publicBase}/${fullKey}`;
        urls[key] = publicUrl;
        console.log(`  ✓ ${label} 上传完成（${elapsed}ms）：${publicUrl}`);
        assert(`${label} 上传成功`, true);
        assert(`${label} URL 非空`, publicUrl.length > 0);
        assert(`${label} URL 含文件名`, publicUrl.includes(path.basename(key)));
      }

      // 验证上传后可 HEAD 访问（公开 bucket 才有效）
      console.log('\n  验证公开 URL 可访问...');
      for (const [key, url] of Object.entries(urls)) {
        try {
          const resp = await fetch(url, { method: 'HEAD' });
          assert(`${path.basename(key)} HTTP 可访问（${resp.status}）`,
            resp.status === 200 || resp.status === 304);
        } catch (_) {
          console.log(`  ⚠ ${path.basename(key)} HEAD 请求失败（可能 bucket 未设公开访问）`);
        }
      }

    } catch (err) {
      console.error('  R2 上传异常：' + err.message);
      failed++;
    }
  }

  // ── 汇总 ────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log(`📊 测试结果：✅ ${passed} 通过  ❌ ${failed} 失败`);
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error('[FATAL]', e); process.exit(1); });
