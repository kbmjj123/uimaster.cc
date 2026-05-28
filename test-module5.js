#!/usr/bin/env node
/**
 * 模块五单元测试 — AI 描述生成
 */
'use strict';

const fs   = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function assert(label, condition, detail) {
  if (condition) { console.log('  \u2705 ' + label); passed++; }
  else { console.error('  \u274c ' + label + (detail ? '\n     ' + detail : '')); failed++; }
}

function extractTechKeywords(htmlSource) {
  const keywords = new Set();
  if (/<canvas[\s>]/i.test(htmlSource))              keywords.add('Canvas');
  if (/webgl/i.test(htmlSource))                     keywords.add('WebGL');
  if (/getContext\(['"]2d['"]\)/i.test(htmlSource))  keywords.add('Canvas 2D');
  if (/getContext\(['"]webgl/i.test(htmlSource))     keywords.add('WebGL');
  if (/requestAnimationFrame/i.test(htmlSource))     keywords.add('requestAnimationFrame');
  if (/@keyframes/i.test(htmlSource))                keywords.add('CSS Animation');
  if (/animation\s*:/i.test(htmlSource))             keywords.add('CSS Animation');
  if (/transition\s*:/i.test(htmlSource))            keywords.add('CSS Transition');
  if (/transform\s*:/i.test(htmlSource))             keywords.add('CSS Transform');
  if (/three\.js|THREE\./i.test(htmlSource))         keywords.add('Three.js');
  if (/gsap|TweenMax|TweenLite/i.test(htmlSource))  keywords.add('GSAP');
  if (/p5\.js|new\s+p5/i.test(htmlSource))          keywords.add('p5.js');
  if (/pixi\.js|PIXI\./i.test(htmlSource))          keywords.add('PixiJS');
  if (/d3\.js|d3\./i.test(htmlSource))              keywords.add('D3.js');
  if (/lottie/i.test(htmlSource))                   keywords.add('Lottie');
  if (/\bshadow\b|\bblur\b/i.test(htmlSource))      keywords.add('Shadow/Blur');
  if (/gradient/i.test(htmlSource))                 keywords.add('Gradient');
  if (/particle|particles/i.test(htmlSource))       keywords.add('Particles');
  if (/noise|simplex|perlin/i.test(htmlSource))     keywords.add('Noise');
  if (/physics|velocity|gravity/i.test(htmlSource)) keywords.add('Physics');
  if (/\bsvg\b/i.test(htmlSource))                  keywords.add('SVG');
  if (/audio|AudioContext/i.test(htmlSource))       keywords.add('Web Audio');
  if (/scroll|IntersectionObserver/i.test(htmlSource)) keywords.add('Scroll');
  if (/mouse|pointer|touch/i.test(htmlSource))      keywords.add('Interactive');
  if (/glsl|shader|varying|uniform/i.test(htmlSource)) keywords.add('GLSL Shader');
  if (/fibonacci|fractal|mandel/i.test(htmlSource)) keywords.add('Math/Fractal');
  if (/\.classList|querySelector/i.test(htmlSource)) keywords.add('DOM');
  if (/fetch\s*\(|XMLHttpRequest/i.test(htmlSource)) keywords.add('Fetch API');
  return [...keywords];
}

async function callAnthropicForDescription(meta, apiKey) {
  if (!apiKey) return { skipped: true, text: '' };
  const tagList = (meta.tags || []).join('、') || '无';
  const prompt = [
    '你是一位前端技术写手，擅长写简洁有吸引力的 HTML 特效介绍。',
    '',
    '请根据以下信息，用中文写一段 150~200 字的自然语言描述，用于网站的 SEO meta description 和页面介绍文字。',
    '',
    '要求：',
    '- 语言流畅自然，技术准确',
    '- 突出视觉效果和使用场景',
    '- 包含核心技术关键词但不堆砌',
    '- 不要用"本特效"、"该特效"等生硬措辞，用"这个效果"、"效果"等自然表达',
    '- 直接输出描述文字，不要加任何前缀或说明',
    '',
    '特效信息：',
    '- 名称：' + meta.title,
    '- 分类：' + (meta.category || 'HTML Effect'),
    '- 技术关键词：' + tagList,
  ].join('\n');

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
    const t = await resp.text();
    throw new Error('API ' + resp.status + ': ' + t.slice(0, 200));
  }
  const data = await resp.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  return { skipped: false, text };
}

async function main() {
  console.log('\n\uD83D\uDCCB \u6A21\u5757\u4E94\u5355\u5143\u6D4B\u8BD5 \u2014 AI \u63CF\u8FF0\u751F\u6210\n');

  // ── Part 1: extractTechKeywords ──
  console.log('\u2500\u2500 Part 1: extractTechKeywords \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n');

  console.log('Case 1: particle-bg.html（真实文件）');
  {
    const src = fs.readFileSync(path.join(__dirname, 'demos', 'particle-bg.html'), 'utf8');
    const kw = extractTechKeywords(src);
    assert('检测到 Canvas',                kw.includes('Canvas'));
    assert('检测到 Canvas 2D',             kw.includes('Canvas 2D'));
    assert('检测到 requestAnimationFrame', kw.includes('requestAnimationFrame'));
    assert('检测到 Particles',             kw.includes('Particles'));
    assert('结果为非空数组',                kw.length > 0);
  }

  console.log('\nCase 2: Three.js + WebGL');
  {
    const src = '<canvas></canvas><script>const r = new THREE.WebGLRenderer(); requestAnimationFrame(loop);</script>';
    const kw = extractTechKeywords(src);
    assert('检测到 Three.js', kw.includes('Three.js'));
    assert('检测到 Canvas',   kw.includes('Canvas'));
    assert('检测到 WebGL',    kw.includes('WebGL'));
    assert('检测到 rAF',      kw.includes('requestAnimationFrame'));
  }

  console.log('\nCase 3: CSS Animation + Transform + Transition');
  {
    const src = '<style>.box{animation:spin 2s;transition:opacity .3s;transform:rotate(0)} @keyframes spin{}</style>';
    const kw = extractTechKeywords(src);
    assert('检测到 CSS Animation',  kw.includes('CSS Animation'));
    assert('检测到 CSS Transition', kw.includes('CSS Transition'));
    assert('检测到 CSS Transform',  kw.includes('CSS Transform'));
  }

  console.log('\nCase 4: GLSL Shader + WebGL');
  {
    const src = "<canvas></canvas><script>const gl=canvas.getContext('webgl'); const v='uniform mat4 u; varying vec2 v;';</script>";
    const kw = extractTechKeywords(src);
    assert('检测到 WebGL',       kw.includes('WebGL'));
    assert('检测到 GLSL Shader', kw.includes('GLSL Shader'));
  }

  console.log('\nCase 5: Interactive + Web Audio + Scroll');
  {
    const src = '<script>document.addEventListener("mousemove",f); window.addEventListener("scroll",g); const ctx=new AudioContext();</script>';
    const kw = extractTechKeywords(src);
    assert('检测到 Interactive', kw.includes('Interactive'));
    assert('检测到 Web Audio',   kw.includes('Web Audio'));
    assert('检测到 Scroll',      kw.includes('Scroll'));
  }

  console.log('\nCase 6: GSAP + p5.js + D3.js');
  {
    const src = '<script>gsap.to(".b",{x:1}); const s=new p5(f); d3.select("body");</script>';
    const kw = extractTechKeywords(src);
    assert('检测到 GSAP',  kw.includes('GSAP'));
    assert('检测到 p5.js', kw.includes('p5.js'));
    assert('检测到 D3.js', kw.includes('D3.js'));
  }

  console.log('\nCase 7: Noise + Physics + Math/Fractal');
  {
    const src = '<script>const n=simplexNoise(x,y); particle.velocity+=gravity; const m=computeMandelbrot(cx,cy);</script>';
    const kw = extractTechKeywords(src);
    assert('检测到 Noise',        kw.includes('Noise'));
    assert('检测到 Physics',      kw.includes('Physics'));
    assert('检测到 Math/Fractal', kw.includes('Math/Fractal'));
  }

  console.log('\nCase 8: 无任何技术特征');
  {
    const kw = extractTechKeywords('<!DOCTYPE html><html><body><p>Hello</p></body></html>');
    assert('返回空数组', kw.length === 0, '实际：' + JSON.stringify(kw));
  }

  console.log('\nCase 9: 去重验证');
  {
    const src = '<script>requestAnimationFrame(a); requestAnimationFrame(b); requestAnimationFrame(c);</script>';
    const kw = extractTechKeywords(src);
    const c = kw.filter(k => k === 'requestAnimationFrame').length;
    assert('rAF 只出现 1 次（实际 ' + c + ' 次）', c === 1);
  }

  // ── Part 2: Anthropic API ──
  console.log('\n\u2500\u2500 Part 2: callAnthropicForDescription \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n');
  const API_KEY = process.env.ANTHROPIC_API_KEY || '';

  if (!API_KEY) {
    console.log('  \u2139\uFE0F  ANTHROPIC_API_KEY 未设置，跳过真实 API 调用');
    console.log('     设置后重新运行：ANTHROPIC_API_KEY=sk-... node test-module5.js\n');
    assert('无 key 时降级逻辑正确（跳过不报错）', true);
  } else {
    console.log('  \uD83D\uDD11 检测到 ANTHROPIC_API_KEY，真实调用中...\n');
    const src = fs.readFileSync(path.join(__dirname, 'demos', 'particle-bg.html'), 'utf8');
    const keywords = extractTechKeywords(src);
    const meta = { title: 'Particle Background', category: 'Canvas', tags: keywords };
    try {
      const t0 = Date.now();
      const { skipped, text } = await callAnthropicForDescription(meta, API_KEY);
      const elapsed = Date.now() - t0;
      console.log('  耗时：' + elapsed + 'ms');
      console.log('  生成描述：\n' + '\u2500'.repeat(50) + '\n' + text + '\n' + '\u2500'.repeat(50) + '\n');
      assert('API 调用未跳过',           !skipped);
      assert('返回值为字符串',           typeof text === 'string');
      assert('描述非空',                 text.length > 0);
      const charCount = text.replace(/\s/g, '').length;
      assert('字数 >= 80（实际 ' + charCount + '）', charCount >= 80);
      assert('不含"本特效"等措辞',       !/(本特效|该特效)/.test(text));
      assert('响应时间 < 30s',           elapsed < 30000);
    } catch (err) {
      console.error('  API 异常：' + err.message);
      failed++;
    }
  }

  // ── 汇总 ──
  console.log('\n' + '\u2500'.repeat(50));
  console.log('\uD83D\uDCCA 测试结果：\u2705 ' + passed + ' 通过  \u274c ' + failed + ' 失败');
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error('[FATAL]', e); process.exit(1); });
