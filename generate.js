#!/usr/bin/env node
/**
 * HTML Effects Gallery — generate.js
 * 自动化流水线：封面生成 → OG Image → HTML 回写 → AI 描述 → R2 上传 → D1 写入 → 文件移动
 *
 * 运行方式：
 *   node generate.js              全量处理 demos/ 目录下所有 HTML
 *   node generate.js --new        只处理新增文件（D1 中尚未入库的）
 *   node generate.js --file demo1.html  只处理指定单个文件
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

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

// ============================================================
// Chrome 可执行路径（自动探测，优先 env 变量）
// ============================================================
function detectChrome() {
  if (process.env.CHROME_EXECUTABLE) return process.env.CHROME_EXECUTABLE;

  // Puppeteer 自带缓存路径探测
  const cacheRoots = [
    path.join(os.homedir(), '.cache', 'puppeteer', 'chrome'),
    path.join('/home/claude', '.cache', 'puppeteer', 'chrome'),
    path.join('/root', '.cache', 'puppeteer', 'chrome'),
  ];
  for (const root of cacheRoots) {
    if (!fs.existsSync(root)) continue;
    const versions = fs.readdirSync(root).sort().reverse();
    for (const ver of versions) {
      const bin = path.join(root, ver, 'chrome-linux64', 'chrome');
      if (fs.existsSync(bin)) return bin;
    }
  }

  // 系统 PATH 中查找
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    try { return execSync(`which ${name}`, { stdio: ['pipe','pipe','pipe'] }).toString().trim(); } catch (_) {}
  }

  throw new Error(
    'Chrome/Chromium 未找到。请安装 Chromium 或设置环境变量 CHROME_EXECUTABLE=/path/to/chrome'
  );
}

const CHROME_EXECUTABLE = detectChrome();

// ============================================================
// CONFIG — 集中管理所有可调参数
// ============================================================
const CONFIG = {
  // 目录路径
  demosDir: path.resolve(__dirname, 'demos'),
  doneDir: path.resolve(__dirname, 'demos/done'),
  coversDir: path.resolve(__dirname, 'covers'),
  ogDir: path.resolve(__dirname, 'og'),

  // 封面录制参数
  coverWidth: 640,
  coverHeight: 400,
  recordFrameCount: 30,       // 总录制帧数
  recordFrameInterval: 150,   // 帧间隔毫秒（150ms ≈ ~6.6fps）
  recordWaitMs: 2000,         // 页面加载后等待动画展示的时长（ms）

  // OG Image 尺寸
  ogWidth: 1200,
  ogHeight: 630,

  // Cloudflare R2
  r2BucketName: 'html-effects-gallery',
  r2Prefix: '',               // 可选前缀路径，如 'v1/'
  r2PublicBase: process.env.R2_PUBLIC_BASE || 'https://your-r2-domain.com',

  // Cloudflare D1
  d1DatabaseId: process.env.CF_D1_DATABASE_ID || '',
  d1AccountId: process.env.CF_ACCOUNT_ID || '',
  d1ApiToken: process.env.CF_API_TOKEN || '',

  // AI 描述接口（Anthropic）
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  // R2 访问凭据（S3 兼容）
  r2AccountId: process.env.CF_ACCOUNT_ID || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
};

// ============================================================
// 解析命令行参数
// ============================================================
function parseArgs() {
  const args = process.argv.slice(2);
  const mode = {
    type: 'all',   // 'all' | 'new' | 'file'
    file: null,
  };

  if (args.includes('--new')) {
    mode.type = 'new';
  } else if (args.includes('--file')) {
    const idx = args.indexOf('--file');
    const filename = args[idx + 1];
    if (!filename) {
      console.error('[ERROR] --file 参数需要指定文件名，例如：node generate.js --file demo1.html');
      process.exit(1);
    }
    mode.type = 'file';
    mode.file = filename;
  }

  return mode;
}

// ============================================================
// 工具函数
// ============================================================

/** 获取 demos/ 下所有 .html 文件列表（不含 done/ 子目录） */
function getDemoFiles() {
  if (!fs.existsSync(CONFIG.demosDir)) {
    console.warn(`[WARN] demos/ 目录不存在：${CONFIG.demosDir}`);
    return [];
  }
  return fs.readdirSync(CONFIG.demosDir)
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(CONFIG.demosDir, f));
}

/** 从文件名提取 id（去掉扩展名） */
function fileToId(htmlPath) {
  return path.basename(htmlPath, '.html');
}

/** 确保目录存在 */
function ensureDirs() {
  [CONFIG.demosDir, CONFIG.doneDir, CONFIG.coversDir, CONFIG.ogDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[INIT] 创建目录：${dir}`);
    }
  });
}

/** 格式化当前时间 */
function now() {
  return new Date().toISOString();
}

/** 等待指定毫秒 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// 流水线各模块占位（后续模块逐步实现）
// ============================================================

// ============================================================
// 模块二：封面生成（动图 + 静图）
// ============================================================

/** 启动 Puppeteer 浏览器实例（统一配置） */
async function launchBrowser() {
  const puppeteer = require('puppeteer');
  console.log(`  [browser] 启动 Chrome：${CHROME_EXECUTABLE}`);
  return puppeteer.launch({
    executablePath: CHROME_EXECUTABLE,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',        // 允许 file:// 跨域资源
      '--allow-file-access-from-files', // 允许本地 HTML 加载本地资源
    ],
  });
}

/**
 * 录制多帧截图
 * @param {import('puppeteer').Page} page
 * @param {string} htmlPath  本地 HTML 文件绝对路径
 * @returns {Promise<Buffer[]>}  PNG buffer 数组
 */
async function recordFrames(page, htmlPath) {
  // 设置视口
  await page.setViewport({
    width: CONFIG.coverWidth,
    height: CONFIG.coverHeight,
    deviceScaleFactor: 1,
  });

  // 加载本地 HTML（file:// 协议）
  const fileUrl = `file://${htmlPath}`;
  console.log(`  [record] 加载页面：${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  // 等待动画充分展示
  console.log(`  [record] 等待动画展示 ${CONFIG.recordWaitMs}ms...`);
  await sleep(CONFIG.recordWaitMs);

  // 按帧间隔连续截图
  console.log(`  [record] 开始录制 ${CONFIG.recordFrameCount} 帧，间隔 ${CONFIG.recordFrameInterval}ms`);
  const frames = [];
  for (let i = 0; i < CONFIG.recordFrameCount; i++) {
    const buf = await page.screenshot({ type: 'png' });
    frames.push(buf);
    if (i < CONFIG.recordFrameCount - 1) {
      await sleep(CONFIG.recordFrameInterval);
    }
    if ((i + 1) % 10 === 0) {
      console.log(`  [record] 已录制 ${i + 1}/${CONFIG.recordFrameCount} 帧`);
    }
  }
  console.log(`  [record] ✓ 录制完成，共 ${frames.length} 帧`);
  return frames;
}

/** 从帧数组提取第一帧 */
function extractFirstFrame(frames) {
  if (!frames || frames.length === 0) throw new Error('帧数组为空，无法提取首帧');
  return frames[0];
}

/**
 * 将帧数组用 ffmpeg 合成动态 WebP
 * 失败时降级为保存静态 PNG
 */
async function framesToAnimatedWebP(frames, outputPath) {
  // 检查 ffmpeg 是否可用
  let ffmpegOk = false;
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    ffmpegOk = true;
  } catch (_) {}

  if (!ffmpegOk) {
    console.warn('  [webp] ⚠ ffmpeg 不可用，降级为静态 PNG');
    const fallbackPath = outputPath.replace(/\.webp$/, '.png');
    fs.writeFileSync(fallbackPath, frames[0]);
    console.log(`  [webp] 已保存静态 PNG：${path.basename(fallbackPath)}`);
    return fallbackPath;
  }

  // 将帧写入临时目录
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'heg-frames-'));
  console.log(`  [webp] 写入 ${frames.length} 帧到临时目录...`);
  try {
    for (let i = 0; i < frames.length; i++) {
      const framePath = path.join(tmpDir, `frame_${String(i).padStart(4, '0')}.png`);
      fs.writeFileSync(framePath, frames[i]);
    }

    // 计算帧率（fps = 1000 / interval）
    const fps = Math.round(1000 / CONFIG.recordFrameInterval);

    // 调用 ffmpeg 合成动态 WebP
    const inputPattern = path.join(tmpDir, 'frame_%04d.png');
    console.log(`  [webp] ffmpeg 合成动态 WebP（fps=${fps}）...`);

    await new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-framerate', String(fps),
        '-i', inputPattern,
        '-loop', '0',          // 无限循环
        '-quality', '82',
        '-compression_level', '4',
        outputPath,
      ];
      const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';
      proc.stderr.on('data', d => { stderr += d.toString(); });
      proc.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg 退出码 ${code}:\n${stderr.slice(-500)}`));
      });
    });

    console.log(`  [webp] ✓ 动态 WebP 已保存：${path.basename(outputPath)}`);
    return outputPath;

  } finally {
    // 清理临时帧文件
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

/**
 * 将首帧 buffer 保存为静态 WebP（通过 ffmpeg）
 * 失败时降级为 PNG
 */
async function saveStaticWebP(frameBuffer, outputPath) {
  let ffmpegOk = false;
  try { execSync('ffmpeg -version', { stdio: 'pipe' }); ffmpegOk = true; } catch (_) {}

  if (!ffmpegOk) {
    const fallback = outputPath.replace(/\.webp$/, '.png');
    fs.writeFileSync(fallback, frameBuffer);
    console.log(`  [static] ⚠ ffmpeg 不可用，降级为 PNG：${path.basename(fallback)}`);
    return fallback;
  }

  // 写入临时 PNG
  const tmpPng = path.join(os.tmpdir(), `heg-static-${Date.now()}.png`);
  fs.writeFileSync(tmpPng, frameBuffer);

  try {
    await new Promise((resolve, reject) => {
      const proc = spawn('ffmpeg', [
        '-y', '-i', tmpPng,
        '-quality', '85',
        outputPath,
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';
      proc.stderr.on('data', d => { stderr += d.toString(); });
      proc.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg static webp 失败 (code ${code}): ${stderr.slice(-300)}`));
      });
    });
    console.log(`  [static] ✓ 静图 WebP 已保存：${path.basename(outputPath)}`);
    return outputPath;
  } finally {
    try { fs.unlinkSync(tmpPng); } catch (_) {}
  }
}

/**
 * 模块二主函数：封面生成（动图 + 静图）
 * @param {string} htmlPath
 * @returns {{ animatedPath: string, staticPath: string, firstFrameBuffer: Buffer }}
 */
async function generateCovers(htmlPath) {
  const id = fileToId(htmlPath);
  const animatedPath = path.join(CONFIG.coversDir, `${id}.webp`);
  const staticPath   = path.join(CONFIG.coversDir, `${id}-static.webp`);

  console.log(`  [covers] 开始生成封面：${id}`);
  const browser = await launchBrowser();
  let frames;

  try {
    const page = await browser.newPage();
    frames = await recordFrames(page, htmlPath);
    await page.close();
  } finally {
    await browser.close();
    console.log(`  [browser] 浏览器已关闭`);
  }

  // 提取首帧
  const firstFrameBuffer = extractFirstFrame(frames);

  // 并行生成动图和静图
  console.log(`  [covers] 生成动图和静图...`);
  const [actualAnimatedPath, actualStaticPath] = await Promise.all([
    framesToAnimatedWebP(frames, animatedPath),
    saveStaticWebP(firstFrameBuffer, staticPath),
  ]);

  // 打印文件大小
  const animSize = (fs.statSync(actualAnimatedPath).size / 1024).toFixed(1);
  const staticSize = (fs.statSync(actualStaticPath).size / 1024).toFixed(1);
  console.log(`  [covers] ✅ 封面生成完成`);
  console.log(`           动图：${path.basename(actualAnimatedPath)} (${animSize} KB)`);
  console.log(`           静图：${path.basename(actualStaticPath)} (${staticSize} KB)`);

  return {
    animatedPath: actualAnimatedPath,
    staticPath: actualStaticPath,
    firstFrameBuffer,
  };
}

// ============================================================
// 模块三：OG Image 生成
// ============================================================

/**
 * 渲染 og-template.html，注入截图和 meta 数据，截图输出 1200×630 WebP
 *
 * @param {Buffer|null} screenshotBuffer  封面首帧 PNG buffer
 * @param {object}      meta              { id, title, category, description, tags }
 * @param {string}      htmlPath          原始 HTML 路径（用于提取 id）
 * @returns {Promise<string>}             输出文件的本地绝对路径
 */
async function generateOgImage(screenshotBuffer, meta, htmlPath) {
  const id = fileToId(htmlPath);
  const outputPath = path.join(CONFIG.ogDir, `${id}-og.webp`);
  const templatePath = path.resolve(__dirname, 'og-template.html');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`og-template.html 不存在：${templatePath}`);
  }

  console.log(`  [og] 渲染 OG Image：${id}`);

  // 将截图 buffer 转 base64（如果有）
  const screenshotBase64 = screenshotBuffer
    ? screenshotBuffer.toString('base64')
    : null;

  // 规范化 tags（支持字符串 / 数组 / JSON 字符串）
  let tags = meta.tags || [];
  if (typeof tags === 'string') {
    try { tags = JSON.parse(tags); } catch (_) { tags = tags.split(',').map(t => t.trim()).filter(Boolean); }
  }

  // 组装注入数据
  const ogData = {
    screenshotBase64,
    title:       meta.title       || id,
    category:    meta.category    || 'HTML Effect',
    description: meta.description || '',
    tags,
  };

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();

    // 设置 1200×630 视口
    await page.setViewport({
      width:  CONFIG.ogWidth,
      height: CONFIG.ogHeight,
      deviceScaleFactor: 1,
    });

    // 加载模板
    const templateUrl = `file://${templatePath}`;
    await page.goto(templateUrl, { waitUntil: 'networkidle0', timeout: 20000 });

    // 注入数据并触发渲染
    await page.evaluate((data) => {
      window.__OG_DATA__ = data;
      if (typeof window.__applyOgData__ === 'function') {
        window.__applyOgData__(data);
      }
    }, ogData);

    // 等待图片加载完成（若有 base64 截图）
    if (screenshotBase64) {
      await page.waitForFunction(() => {
        const img = document.getElementById('preview-img');
        return img && img.complete && img.naturalWidth > 0;
      }, { timeout: 10000 }).catch(() => {
        console.warn('  [og] ⚠ 截图加载超时，继续渲染');
      });
    }

    // 额外等待字体/布局稳定
    await sleep(300);

    // 截图输出为 PNG buffer，再转 WebP
    const pngBuffer = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: CONFIG.ogWidth, height: CONFIG.ogHeight },
    });

    await page.close();

    // 用 ffmpeg 转为 WebP
    const tmpPng = path.join(os.tmpdir(), `heg-og-${id}-${Date.now()}.png`);
    fs.writeFileSync(tmpPng, pngBuffer);

    try {
      await new Promise((resolve, reject) => {
        const proc = spawn('ffmpeg', [
          '-y', '-i', tmpPng,
          '-quality', '88',
          outputPath,
        ], { stdio: ['ignore', 'pipe', 'pipe'] });
        let stderr = '';
        proc.stderr.on('data', d => { stderr += d.toString(); });
        proc.on('close', code => {
          if (code === 0) resolve();
          else reject(new Error(`ffmpeg OG 转 WebP 失败 (code ${code}): ${stderr.slice(-300)}`));
        });
      });
    } finally {
      try { fs.unlinkSync(tmpPng); } catch (_) {}
    }

    const sizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);
    console.log(`  [og] ✅ OG Image 生成完成：${path.basename(outputPath)} (${sizeKb} KB)`);
    return outputPath;

  } finally {
    await browser.close();
  }
}

// ============================================================
// 模块四：原始 HTML 回写
// ============================================================

/**
 * 回写 og:image 系列 meta 标签到原始 HTML
 * - 已存在 → 替换
 * - 不存在 → 注入到 </head> 前
 */
function rewriteHtmlMeta(html, ogImageUrl) {
  const ogTags = [
    `<meta property="og:image" content="${ogImageUrl}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
  ].join('\n    ');

  // 先整体移除已存在的 og:image / og:image:width / og:image:height（任意属性顺序、单引号/双引号、自闭合）
  let result = html
    .replace(/<meta\s[^>]*property=["']og:image["'][^>]*\/?>/gi, '')
    .replace(/<meta\s[^>]*property=["']og:image:width["'][^>]*\/?>/gi, '')
    .replace(/<meta\s[^>]*property=["']og:image:height["'][^>]*\/?>/gi, '');

  // 清理因替换产生的多余空行（最多保留两个连续空行）
  result = result.replace(/\n{3,}/g, '\n\n');

  if (result.includes('</head>')) {
    // 注入到 </head> 前
    result = result.replace('</head>', `    ${ogTags}\n</head>`);
    console.log(`  [rewrite] og:image meta 已注入到 </head> 前`);
  } else {
    // 无 </head>，追加到文件末尾（极少数情况）
    result += `\n${ogTags}\n`;
    console.warn(`  [rewrite] ⚠ 未找到 </head>，og:image meta 追加到文件末尾`);
  }

  return result;
}

/**
 * 同步更新 <script type="application/ld+json"> 中的 image 字段
 * 不存在则跳过
 */
function rewriteJsonLd(html, ogImageUrl) {
  // 匹配 JSON-LD script 块（支持多行）
  const jsonLdRe = /(<script\s[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi;
  let found = false;

  const result = html.replace(jsonLdRe, (match, open, content, close) => {
    let obj;
    try {
      obj = JSON.parse(content.trim());
    } catch (_) {
      console.warn(`  [rewrite] ⚠ JSON-LD 解析失败，跳过更新`);
      return match;
    }

    obj.image = ogImageUrl;
    found = true;
    // 保持 2 空格缩进，输出美观
    return `${open}\n${JSON.stringify(obj, null, 2)}\n${close}`;
  });

  if (found) {
    console.log(`  [rewrite] JSON-LD image 字段已更新`);
  } else {
    console.log(`  [rewrite] 未发现 JSON-LD，跳过`);
  }

  return result;
}

/**
 * 注入 noindex 标签
 * 已存在 <meta name="robots"> 则跳过，不存在则注入到 </head> 前
 */
function injectNoindex(html) {
  // 检查是否已有 robots meta（任意 content）
  const hasRobots = /<meta\s[^>]*name=["']robots["'][^>]*>/i.test(html);

  if (hasRobots) {
    console.log(`  [rewrite] robots meta 已存在，跳过注入`);
    return html;
  }

  const noindexTag = `<meta name="robots" content="noindex, nofollow">`;

  if (html.includes('</head>')) {
    const result = html.replace('</head>', `    ${noindexTag}\n</head>`);
    console.log(`  [rewrite] noindex 已注入`);
    return result;
  }

  console.warn(`  [rewrite] ⚠ 未找到 </head>，noindex 追加到文件末尾`);
  return html + `\n${noindexTag}\n`;
}

/**
 * 模块四主函数：回写 HTML（og meta + JSON-LD + noindex），覆盖原文件
 */
async function rewriteHtml(htmlPath, ogImageUrl) {
  console.log(`  [rewrite] 开始回写：${path.basename(htmlPath)}`);

  let html = fs.readFileSync(htmlPath, 'utf8');
  const originalLen = html.length;

  // Step 1: 回写 og:image meta
  html = rewriteHtmlMeta(html, ogImageUrl);

  // Step 2: 更新 JSON-LD image 字段
  html = rewriteJsonLd(html, ogImageUrl);

  // Step 3: 注入 noindex
  html = injectNoindex(html);

  // 覆盖原文件
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`  [rewrite] ✅ 回写完成（${originalLen} → ${html.length} 字节）`);
}

// ============================================================
// 模块五：AI 描述生成
// ============================================================

/**
 * 解析 HTML 源码，提取技术关键词
 * @param {string} htmlSource
 * @returns {string[]}  去重后的关键词数组
 */
function extractTechKeywords(htmlSource) {
  const keywords = new Set();

  // Canvas / WebGL
  if (/<canvas[\s>]/i.test(htmlSource))             keywords.add('Canvas');
  if (/webgl/i.test(htmlSource))                    keywords.add('WebGL');
  if (/getContext\(['"]2d['"]\)/i.test(htmlSource)) keywords.add('Canvas 2D');
  if (/getContext\(['"]webgl/i.test(htmlSource))    keywords.add('WebGL');

  // 动画 / 渲染
  if (/requestAnimationFrame/i.test(htmlSource))    keywords.add('requestAnimationFrame');
  if (/@keyframes/i.test(htmlSource))               keywords.add('CSS Animation');
  if (/animation\s*:/i.test(htmlSource))            keywords.add('CSS Animation');
  if (/transition\s*:/i.test(htmlSource))           keywords.add('CSS Transition');
  if (/transform\s*:/i.test(htmlSource))            keywords.add('CSS Transform');

  // 常见库
  if (/three\.js|THREE\./i.test(htmlSource))       keywords.add('Three.js');
  if (/gsap|TweenMax|TweenLite/i.test(htmlSource)) keywords.add('GSAP');
  if (/p5\.js|new\s+p5/i.test(htmlSource))        keywords.add('p5.js');
  if (/pixi\.js|PIXI\./i.test(htmlSource))        keywords.add('PixiJS');
  if (/d3\.js|d3\./i.test(htmlSource))            keywords.add('D3.js');
  if (/lottie/i.test(htmlSource))                  keywords.add('Lottie');

  // 技术特征
  if (/\bshadow\b|\bblur\b/i.test(htmlSource))   keywords.add('Shadow/Blur');
  if (/gradient/i.test(htmlSource))                keywords.add('Gradient');
  if (/particle|particles/i.test(htmlSource))      keywords.add('Particles');
  if (/noise|simplex|perlin/i.test(htmlSource))    keywords.add('Noise');
  if (/physics|velocity|gravity/i.test(htmlSource))keywords.add('Physics');
  if (/\bsvg\b/i.test(htmlSource))                keywords.add('SVG');
  if (/audio|AudioContext/i.test(htmlSource))      keywords.add('Web Audio');
  if (/scroll|IntersectionObserver/i.test(htmlSource)) keywords.add('Scroll');
  if (/mouse|pointer|touch/i.test(htmlSource))     keywords.add('Interactive');
  if (/glsl|shader|varying|uniform/i.test(htmlSource)) keywords.add('GLSL Shader');
  if (/fibonacci|fractal|mandel/i.test(htmlSource))keywords.add('Math/Fractal');
  if (/\.classList|querySelector/i.test(htmlSource))keywords.add('DOM');
  if (/fetch\s*\(|XMLHttpRequest/i.test(htmlSource))keywords.add('Fetch API');

  return [...keywords];
}

/**
 * 调用 Anthropic API 生成 150~200 字描述
 * 失败时降级返回空字符串，不中断流程
 */
async function callAnthropicForDescription(meta) {
  const apiKey = CONFIG.anthropicApiKey;
  if (!apiKey) {
    console.warn('  [ai] ⚠ ANTHROPIC_API_KEY 未设置，跳过 AI 描述生成');
    return '';
  }

  const tagList = (meta.tags || []).join('、') || '无';
  const prompt = `你是一位前端技术写手，擅长写简洁有吸引力的 HTML 特效介绍。

请根据以下信息，用中文写一段 150~200 字的自然语言描述，用于网站的 SEO meta description 和页面介绍文字。

要求：
- 语言流畅自然，技术准确
- 突出视觉效果和使用场景
- 包含核心技术关键词但不堆砌
- 不要用"本特效"、"该特效"等生硬措辞，用"这个效果"、"效果"等自然表达
- 直接输出描述文字，不要加任何前缀或说明

特效信息：
- 名称：${meta.title}
- 分类：${meta.category || 'HTML Effect'}
- 技术关键词：${tagList}`;

  try {
    console.log(`  [ai] 调用 Anthropic API 生成描述...`);
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`API 返回 ${resp.status}: ${errText.slice(0, 200)}`);
    }

    const data = await resp.json();
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    const charCount = text.replace(/\s/g, '').length;
    console.log(`  [ai] ✅ 描述生成完成（${charCount} 字）`);
    return text;

  } catch (err) {
    console.warn(`  [ai] ⚠ AI 描述生成失败，降级为空字符串：${err.message}`);
    return '';
  }
}

/**
 * 模块五主函数：提取技术关键词 → 调用 AI 生成描述
 * 同时将 tags 回写到 meta 对象（供后续 D1 写入使用）
 */
async function generateDescription(htmlPath, meta) {
  const htmlSource = fs.readFileSync(htmlPath, 'utf8');

  // Step 1: 提取技术关键词
  const keywords = extractTechKeywords(htmlSource);
  console.log(`  [ai] 提取到技术关键词：${keywords.length > 0 ? keywords.join(', ') : '（无）'}`);

  // 将关键词写回 meta，供后续 D1 入库
  meta.tags = keywords;

  // Step 2: 调用 AI 接口
  const description = await callAnthropicForDescription({ ...meta, tags: keywords });

  return description;
}

// ============================================================
// 模块六：Cloudflare R2 上传
// ============================================================

/** 懒加载 S3Client 单例（避免无凭据时报错）*/
let _r2Client = null;
function getR2Client() {
  if (_r2Client) return _r2Client;

  const { S3Client } = require('@aws-sdk/client-s3');
  const accountId     = CONFIG.r2AccountId;
  const accessKeyId   = CONFIG.r2AccessKeyId;
  const secretKey     = CONFIG.r2SecretAccessKey;

  if (!accountId || !accessKeyId || !secretKey) {
    throw new Error(
      'R2 凭据未配置。请设置环境变量：' +
      'CF_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY'
    );
  }

  _r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey: secretKey },
  });

  return _r2Client;
}

/** 根据文件扩展名推断 ContentType */
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

/**
 * 上传单个文件到 R2
 * @param {string} localPath   本地文件路径
 * @param {string} r2Key       R2 存储路径（不含 bucket 名）
 * @returns {Promise<string>}  文件公开访问 URL
 */
async function uploadToR2(localPath, r2Key) {
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const client      = getR2Client();
  const fileBuffer  = fs.readFileSync(localPath);
  const contentType = getContentType(localPath);
  const bucket      = CONFIG.r2BucketName;
  const fullKey     = CONFIG.r2Prefix ? `${CONFIG.r2Prefix}${r2Key}` : r2Key;

  console.log(`  [r2] 上传 ${path.basename(localPath)} → ${fullKey} (${(fileBuffer.length/1024).toFixed(1)} KB)`);

  try {
    await client.send(new PutObjectCommand({
      Bucket:      bucket,
      Key:         fullKey,
      Body:        fileBuffer,
      ContentType: contentType,
    }));
  } catch (err) {
    throw new Error(`R2 上传失败 [${fullKey}]: ${err.message}`);
  }

  const publicUrl = `${CONFIG.r2PublicBase}/${fullKey}`;
  console.log(`  [r2] ✓ ${path.basename(localPath)} → ${publicUrl}`);
  return publicUrl;
}

/**
 * 模块六主函数：按序上传 4 个文件，返回所有公开 URL
 *
 * 上传顺序（与 PRD 一致）：
 *   1. effects/{id}.html        ← source_url  （回写后的 HTML）
 *   2. covers/{id}.webp         ← cover_url
 *   3. covers/{id}-static.webp  ← cover_static_url
 *   4. og/{id}-og.webp          ← og_image_url
 *
 * @param {string} id        效果 ID
 * @param {string} htmlPath  回写后的本地 HTML 路径
 * @returns {Promise<{sourceUrl, coverUrl, coverStaticUrl, ogImageUrl}>}
 */
async function uploadAllToR2(id, htmlPath) {
  // 检查凭据——无凭据时直接返回占位 URL，不中断流程
  const hasCreds = CONFIG.r2AccountId && CONFIG.r2AccessKeyId && CONFIG.r2SecretAccessKey;
  if (!hasCreds) {
    console.warn('  [r2] ⚠ R2 凭据未设置，跳过上传，返回占位 URL');
    const base = CONFIG.r2PublicBase;
    return {
      sourceUrl:      `${base}/effects/${id}.html`,
      coverUrl:       `${base}/covers/${id}.webp`,
      coverStaticUrl: `${base}/covers/${id}-static.webp`,
      ogImageUrl:     `${base}/og/${id}-og.webp`,
    };
  }

  console.log(`  [r2] 开始上传 ${id} 的 4 个文件...`);

  // 本地文件路径
  const localHtml        = htmlPath;
  const localCover       = path.join(CONFIG.coversDir, `${id}.webp`);
  const localCoverStatic = path.join(CONFIG.coversDir, `${id}-static.webp`);
  const localOg          = path.join(CONFIG.ogDir,     `${id}-og.webp`);

  // 验证本地文件均存在
  const required = [
    [localHtml,        `HTML 文件`],
    [localCover,       `动图封面`],
    [localCoverStatic, `静图封面`],
    [localOg,          `OG Image`],
  ];
  for (const [p, label] of required) {
    if (!fs.existsSync(p)) {
      throw new Error(`R2 上传前置检查失败：${label} 不存在 (${p})`);
    }
  }

  // 按序上传
  const sourceUrl      = await uploadToR2(localHtml,        `effects/${id}.html`);
  const coverUrl       = await uploadToR2(localCover,       `covers/${id}.webp`);
  const coverStaticUrl = await uploadToR2(localCoverStatic, `covers/${id}-static.webp`);
  const ogImageUrl     = await uploadToR2(localOg,          `og/${id}-og.webp`);

  console.log(`  [r2] ✅ 全部上传完成`);
  return { sourceUrl, coverUrl, coverStaticUrl, ogImageUrl };
}

// ============================================================
// 模块七：Cloudflare D1 写入
// ============================================================

/**
 * 调用 Cloudflare D1 REST API 执行一条 SQL
 * @param {string}   sql     SQL 语句（含 ? 占位符）
 * @param {any[]}    params  参数数组
 * @returns {Promise<object>}  API 响应 result[0]
 */
async function d1Query(sql, params = []) {
  const accountId  = CONFIG.d1AccountId;
  const databaseId = CONFIG.d1DatabaseId;
  const apiToken   = CONFIG.d1ApiToken;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error(
      'D1 配置不完整，请设置环境变量：CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN'
    );
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  const body = await resp.json();

  if (!resp.ok || !body.success) {
    const errMsg = (body.errors || []).map(e => e.message).join('; ') || resp.statusText;
    throw new Error(`D1 API 错误 (${resp.status}): ${errMsg}`);
  }

  return body.result?.[0] ?? {};
}

/**
 * 建表 DDL：html_effects + share_records
 * 仅在表不存在时执行（IF NOT EXISTS），幂等安全
 */
async function ensureD1Tables() {
  console.log('  [d1] 确认表结构...');

  await d1Query(`
    CREATE TABLE IF NOT EXISTS html_effects (
      id                 TEXT PRIMARY KEY,
      title              TEXT,
      description        TEXT,
      category           TEXT,
      scene              TEXT,
      tags               TEXT,
      source_url         TEXT,
      cover_url          TEXT,
      cover_static_url   TEXT,
      og_image_url       TEXT,
      date               TEXT,
      is_featured        INTEGER DEFAULT 0,
      view_count         INTEGER DEFAULT 0,
      export_count       INTEGER DEFAULT 0,
      last_exported_at   TEXT,
      share_count        INTEGER DEFAULT 0,
      share_unlock_count INTEGER DEFAULT 0,
      created_at         TEXT,
      updated_at         TEXT
    )
  `);

  await d1Query(`
    CREATE TABLE IF NOT EXISTS share_records (
      id            TEXT PRIMARY KEY,
      effect_id     TEXT,
      share_token   TEXT,
      created_at    TEXT,
      unlocked_at   TEXT,
      visitor_count INTEGER DEFAULT 0
    )
  `);

  console.log('  [d1] ✓ 表结构就绪');
}

/**
 * 检查 D1 中是否已有该 id 的记录
 * @param {string} id
 * @returns {Promise<boolean>}
 */
async function effectExists(id) {
  const result = await d1Query(
    'SELECT id FROM html_effects WHERE id = ? LIMIT 1',
    [id]
  );
  return (result.results?.length ?? 0) > 0;
}

/**
 * 模块七主函数：INSERT 新记录 或 UPDATE 资源 URL 字段
 *
 * 新记录 → 全量 INSERT，写入所有字段 + created_at
 * 已存在 → 只更新资源 URL 字段（source/cover/og）和 updated_at，
 *           保留 title / tags / description 等人工内容
 *
 * @param {object} data  来自 processHtml 的完整数据对象
 */
async function upsertEffect(data) {
  // 检查 D1 凭据——无则跳过，不中断流程
  const hasCreds = CONFIG.d1AccountId && CONFIG.d1DatabaseId && CONFIG.d1ApiToken;
  if (!hasCreds) {
    console.warn('  [d1] ⚠ D1 配置未设置，跳过数据库写入');
    return;
  }

  console.log(`  [d1] 写入记录 id=${data.id}`);

  // 确保表存在
  await ensureD1Tables();

  const ts = now();
  const exists = await effectExists(data.id);

  if (!exists) {
    // ── INSERT：全量写入 ──
    console.log(`  [d1] INSERT 新记录：${data.id}`);
    await d1Query(`
      INSERT INTO html_effects (
        id, title, description, category, scene, tags,
        source_url, cover_url, cover_static_url, og_image_url,
        date, is_featured,
        view_count, export_count, share_count, share_unlock_count,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, 0,
        0, 0, 0, 0,
        ?, ?
      )
    `, [
      data.id,
      data.title        ?? data.id,
      data.description  ?? '',
      data.category     ?? '',
      data.scene        ?? '',
      Array.isArray(data.tags) ? JSON.stringify(data.tags) : (data.tags ?? '[]'),
      data.source_url,
      data.cover_url,
      data.cover_static_url,
      data.og_image_url,
      data.date         ?? ts.split('T')[0],
      ts,   // created_at
      ts,   // updated_at
    ]);
    console.log(`  [d1] ✅ INSERT 完成：${data.id}`);

  } else {
    // ── UPDATE：只更新资源 URL + updated_at，保留人工内容 ──
    console.log(`  [d1] UPDATE 已有记录：${data.id}`);
    await d1Query(`
      UPDATE html_effects SET
        source_url       = ?,
        cover_url        = ?,
        cover_static_url = ?,
        og_image_url     = ?,
        updated_at       = ?
      WHERE id = ?
    `, [
      data.source_url,
      data.cover_url,
      data.cover_static_url,
      data.og_image_url,
      ts,
      data.id,
    ]);
    console.log(`  [d1] ✅ UPDATE 完成：${data.id}`);
  }
}

// ============================================================
// 模块八：文件移动
// ============================================================

/**
 * 将处理完成的 HTML 移动到 demos/done/
 * 规则：
 *   - 整条流水线全部成功后才调用此函数（由 processHtml 保证）
 *   - done/ 中已有同名文件 → 旧文件加时间戳重命名后再移入
 *   - 源文件不存在 → 抛出错误
 */
async function moveToProcessed(htmlPath) {
  const filename = path.basename(htmlPath);
  const destPath = path.join(CONFIG.doneDir, filename);

  // 源文件必须存在
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`[move] 源文件不存在，无法移动：${htmlPath}`);
  }

  // 确保目标目录存在
  if (!fs.existsSync(CONFIG.doneDir)) {
    fs.mkdirSync(CONFIG.doneDir, { recursive: true });
  }

  // 目标已有同名文件 → 旧文件加时间戳备份，避免覆盖
  if (fs.existsSync(destPath)) {
    const stem    = path.basename(filename, '.html');
    const backup  = `${stem}_${Date.now()}.html`;
    const backupPath = path.join(CONFIG.doneDir, backup);
    fs.renameSync(destPath, backupPath);
    console.log(`  [move] 旧文件已备份为 ${backup}`);
  }

  fs.renameSync(htmlPath, destPath);

  // 验证移动成功
  if (!fs.existsSync(destPath)) {
    throw new Error(`[move] 移动后目标文件不存在：${destPath}`);
  }
  if (fs.existsSync(htmlPath)) {
    throw new Error(`[move] 源文件未被移除：${htmlPath}`);
  }

  console.log(`  [move] ✅ ${filename} → demos/done/`);
  return destPath;
}

// ============================================================
// 模块九：流水线串联 + 错误处理
// ============================================================

/**
 * 单步执行器 — 统一记录步骤耗时和错误
 * @param {string}   label   步骤名（如 "1/7 封面生成"）
 * @param {Function} fn      async 执行函数
 * @returns {Promise<any>}   fn 的返回值，失败时抛出
 */
async function runStep(label, fn) {
  const t0 = Date.now();
  process.stdout.write(`\n[${label}] `);
  try {
    const result = await fn();
    const ms = Date.now() - t0;
    console.log(`(${(ms/1000).toFixed(1)}s)`);
    return result;
  } catch (err) {
    const ms = Date.now() - t0;
    console.log(`FAILED (${(ms/1000).toFixed(1)}s)`);
    throw err;
  }
}

/**
 * 单文件完整流水线
 * 任意步骤失败 → 记录错误、不移动文件、返回失败结果
 */
async function processHtml(htmlPath) {
  const id        = fileToId(htmlPath);
  const startTime = Date.now();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[START] ${path.basename(htmlPath)}  (id: ${id})`);
  console.log(`        ${now()}`);
  console.log(`${'='.repeat(60)}`);

  // title 从文件名派生：particle-bg → Particle Bg
  const rawTitle = id.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const meta = {
    id,
    title:       rawTitle,
    category:    'HTML Effect',
    description: '',
    tags:        [],
  };

  try {
    // ── 1/7 封面生成 ──────────────────────────────────────
    const { animatedPath, staticPath, firstFrameBuffer } =
      await runStep('1/7 封面生成', () => generateCovers(htmlPath));

    // ── 2/7 OG Image ──────────────────────────────────────
    await runStep('2/7 OG Image', () => generateOgImage(firstFrameBuffer, meta, htmlPath));

    // ── 3/7 R2 上传 ───────────────────────────────────────
    // 注意：HTML 回写在上传之后，R2 上的 HTML 是最终版本需再 uploadToR2 一次
    // 此步先上传封面 + OG（不含 HTML），HTML 回写后单独上传
    const urls = await runStep('3/7 R2 上传', () => uploadAllToR2(id, htmlPath));

    // ── 4/7 HTML 回写 ─────────────────────────────────────
    await runStep('4/7 HTML 回写', () => rewriteHtml(htmlPath, urls.ogImageUrl));

    // ── 5/7 AI 描述 ───────────────────────────────────────
    // generateDescription 内部会把 tags 写回 meta.tags
    const description = await runStep('5/7 AI 描述', () => generateDescription(htmlPath, meta));
    meta.description = description;

    // ── 6/7 D1 写入 ───────────────────────────────────────
    await runStep('6/7 D1 写入', () => upsertEffect({
      id,
      title:            meta.title,
      description:      meta.description,
      category:         meta.category || '',
      scene:            meta.scene    || '',
      tags:             Array.isArray(meta.tags) ? JSON.stringify(meta.tags) : '[]',
      source_url:       urls.sourceUrl,
      cover_url:        urls.coverUrl,
      cover_static_url: urls.coverStaticUrl,
      og_image_url:     urls.ogImageUrl,
      date:             now().split('T')[0],
    }));

    // ── 7/7 文件移动 ──────────────────────────────────────
    // 只有前 6 步全部成功，才移动文件
    await runStep('7/7 文件移动', () => moveToProcessed(htmlPath));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ [DONE] ${id}  总耗时 ${elapsed}s`);
    console.log(`   封面：${path.basename(animatedPath)}`);
    console.log(`   标签：${meta.tags.join(', ') || '（无）'}`);
    if (meta.description) {
      console.log(`   描述：${meta.description.slice(0, 60)}…`);
    }

    return { id, success: true, elapsed: Number(elapsed), meta };

  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`\n❌ [FAIL] ${id}  耗时 ${elapsed}s`);
    console.error(`   错误：${err.message}`);
    // 打印调用栈方便排查，但不 crash 整个批次
    if (process.env.DEBUG) console.error(err.stack);
    return { id, success: false, error: err.message, elapsed: Number(elapsed) };
  }
}

// ============================================================
// 模块九：main() 入口
// ============================================================
async function main() {
  const mainStart = Date.now();
  console.log('\n🚀 HTML Effects Gallery — 自动化流水线');
  console.log(`   版本：v1.0  时间：${now()}`);
  console.log(`   Chrome：${CHROME_EXECUTABLE}`);

  // 确保所有目录存在
  ensureDirs();

  // 解析运行模式
  const mode = parseArgs();
  console.log(`   模式：${mode.type}${mode.file ? ' → ' + mode.file : ''}\n`);

  // ── 获取待处理文件列表 ──────────────────────────────────
  let files = getDemoFiles();

  if (files.length === 0) {
    console.log('[INFO] demos/ 目录下没有 .html 文件，流程结束。');
    console.log('       把 HTML 特效文件放入 demos/ 后重新运行。');
    return;
  }

  if (mode.type === 'file') {
    const target = path.isAbsolute(mode.file)
      ? mode.file
      : path.join(CONFIG.demosDir, mode.file);
    if (!fs.existsSync(target)) {
      console.error(`[ERROR] 文件不存在：${target}`);
      process.exit(1);
    }
    files = [target];

  } else if (mode.type === 'new') {
    const doneSet = new Set(
      fs.existsSync(CONFIG.doneDir) ? fs.readdirSync(CONFIG.doneDir) : []
    );
    const before = files.length;
    files = files.filter(f => !doneSet.has(path.basename(f)));
    console.log(`[--new] ${before} 个文件，过滤已处理后剩 ${files.length} 个`);
  }

  if (files.length === 0) {
    console.log('[INFO] 没有需要处理的新文件。');
    return;
  }

  console.log(`[QUEUE] 待处理 ${files.length} 个文件（串行执行）：`);
  files.forEach((f, i) => console.log(`        ${i + 1}. ${path.basename(f)}`));

  // ── 串行处理（避免 Puppeteer 并发 OOM）─────────────────
  const results = [];
  for (let i = 0; i < files.length; i++) {
    console.log(`\n[PROGRESS] ${i + 1}/${files.length}`);
    const result = await processHtml(files[i]);
    results.push(result);
  }

  // ── 汇总报告 ────────────────────────────────────────────
  const succeeded = results.filter(r => r.success);
  const failedArr = results.filter(r => !r.success);
  const totalSec  = ((Date.now() - mainStart) / 1000).toFixed(1);

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 汇总报告');
  console.log('='.repeat(60));
  console.log(`   总计：${results.length} 个  ✅ ${succeeded.length} 成功  ❌ ${failedArr.length} 失败`);
  console.log(`   总耗时：${totalSec}s  均耗时：${(totalSec / results.length).toFixed(1)}s/文件`);

  if (succeeded.length > 0) {
    console.log('\n   成功列表：');
    succeeded.forEach(r => console.log(`     ✅ ${r.id}  (${r.elapsed}s)`));
  }

  if (failedArr.length > 0) {
    console.log('\n   失败列表：');
    failedArr.forEach(r => console.log(`     ❌ ${r.id}  ${r.error}`));
    console.log('\n   失败文件仍在 demos/ 中，修复后可重新运行。');
  }

  console.log(`\n   完成时间：${now()}`);

  // 有失败时非零退出，方便 CI/CD 感知
  if (failedArr.length > 0) process.exit(1);
}

// 启动
main().catch(err => {
  console.error('[FATAL]', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});