#!/usr/bin/env node
/**
 * 模块八 + 九测试 — 文件移动 & 流水线串联
 *
 * Part 1: moveToProcessed 单元测试（真实文件系统操作）
 * Part 2: runStep 步骤执行器测试
 * Part 3: processHtml 失败不移动文件验证
 * Part 4: 多文件串行 + --new 过滤验证
 * Part 5: 真实端到端完整流水线（含 Puppeteer）
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execSync, spawnSync } = require('child_process');

let passed = 0, failed = 0;
function assert(label, condition, detail) {
  if (condition) { console.log('  ✅ ' + label); passed++; }
  else { console.error('  ❌ ' + label + (detail ? '\n     ' + detail : '')); failed++; }
}

// ── 内联 moveToProcessed（与 generate.js 完全一致）──────────
async function moveToProcessed(htmlPath, doneDir) {
  const filename = path.basename(htmlPath);
  const destPath = path.join(doneDir, filename);

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`源文件不存在：${htmlPath}`);
  }
  if (!fs.existsSync(doneDir)) {
    fs.mkdirSync(doneDir, { recursive: true });
  }
  if (fs.existsSync(destPath)) {
    const stem   = path.basename(filename, '.html');
    const backup = `${stem}_${Date.now()}.html`;
    fs.renameSync(destPath, path.join(doneDir, backup));
  }
  fs.renameSync(htmlPath, destPath);
  if (!fs.existsSync(destPath)) throw new Error(`移动后目标不存在：${destPath}`);
  if (fs.existsSync(htmlPath))  throw new Error(`源文件未被移除：${htmlPath}`);
  return destPath;
}

// ── 内联 runStep ────────────────────────────────────────────
async function runStep(label, fn) {
  const t0 = Date.now();
  try {
    const result = await fn();
    return result;
  } catch (err) {
    throw err;  // 原样抛出
  }
}

async function main() {
  console.log('\n📋 模块八 + 九测试 — 文件移动 & 流水线串联\n');

  // ── Part 1: moveToProcessed 单元测试 ─────────────────────
  console.log('── Part 1: moveToProcessed ─────────────────────────────\n');

  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'heg-test-'));
  const demos   = path.join(tmpBase, 'demos');
  const done    = path.join(tmpBase, 'demos', 'done');
  fs.mkdirSync(done, { recursive: true });

  // Case 1: 正常移动
  console.log('Case 1: 正常移动到 done/');
  {
    const src = path.join(demos, 'effect-a.html');
    fs.writeFileSync(src, '<html>effect-a</html>');
    const dest = await moveToProcessed(src, done);
    assert('目标文件存在',    fs.existsSync(dest));
    assert('源文件已消失',    !fs.existsSync(src));
    assert('目标路径正确',    dest === path.join(done, 'effect-a.html'));
    assert('内容完整',        fs.readFileSync(dest, 'utf8') === '<html>effect-a</html>');
  }

  // Case 2: done/ 中已有同名文件 → 自动备份旧文件
  console.log('\nCase 2: 同名文件自动备份');
  {
    // 先写一个旧文件到 done/
    const existing = path.join(done, 'effect-b.html');
    fs.writeFileSync(existing, '<html>old-b</html>');
    // 再写一个新的源文件
    const src = path.join(demos, 'effect-b.html');
    fs.writeFileSync(src, '<html>new-b</html>');

    await moveToProcessed(src, done);

    // done/ 中应有 effect-b.html（新内容）+ effect-b_xxxx.html（旧备份）
    const doneFiles = fs.readdirSync(done);
    const backup    = doneFiles.find(f => f.startsWith('effect-b_') && f.endsWith('.html'));

    assert('新文件已移入 done/',    doneFiles.includes('effect-b.html'));
    assert('旧文件已备份',          !!backup, '未找到备份文件');
    assert('新文件内容正确',        fs.readFileSync(path.join(done, 'effect-b.html'), 'utf8') === '<html>new-b</html>');
    assert('备份文件内容正确',      backup && fs.readFileSync(path.join(done, backup), 'utf8') === '<html>old-b</html>');
    assert('源文件已消失',          !fs.existsSync(src));
  }

  // Case 3: 源文件不存在时抛出错误
  console.log('\nCase 3: 源文件不存在时抛出错误');
  {
    let threw = false, errMsg = '';
    try { await moveToProcessed(path.join(demos, 'nonexistent.html'), done); }
    catch (e) { threw = true; errMsg = e.message; }
    assert('抛出错误',        threw);
    assert('错误含"不存在"',  errMsg.includes('不存在'), errMsg);
  }

  // Case 4: done/ 目录不存在时自动创建
  console.log('\nCase 4: done/ 目录不存在时自动创建');
  {
    const newDone = path.join(tmpBase, 'auto-create-done');
    const src     = path.join(tmpBase, 'auto-src.html');
    fs.writeFileSync(src, '<html>auto</html>');
    await moveToProcessed(src, newDone);
    assert('done/ 目录自动创建', fs.existsSync(newDone));
    assert('文件移入自动创建的 done/', fs.existsSync(path.join(newDone, 'auto-src.html')));
  }

  // 清理临时目录
  fs.rmSync(tmpBase, { recursive: true, force: true });

  // ── Part 2: runStep 执行器测试 ────────────────────────────
  console.log('\n── Part 2: runStep 步骤执行器 ──────────────────────────\n');

  // 成功步骤返回值透传
  const val = await runStep('test-step', async () => 42);
  assert('成功时返回值正确透传', val === 42);

  // 失败步骤错误原样抛出
  let caughtMsg = '';
  try { await runStep('fail-step', async () => { throw new Error('step-error'); }); }
  catch (e) { caughtMsg = e.message; }
  assert('失败时错误原样抛出', caughtMsg === 'step-error');

  // async 步骤正确等待
  let sideEffect = false;
  await runStep('async-step', async () => {
    await new Promise(r => setTimeout(r, 10));
    sideEffect = true;
  });
  assert('async 步骤正确等待完成', sideEffect);

  // ── Part 3: 失败不移动文件验证 ───────────────────────────
  console.log('\n── Part 3: 失败不移动文件保护 ──────────────────────────\n');
  {
    // 模拟流水线：步骤 N 失败时，不应调用 moveToProcessed
    let moveCalled = false;

    async function mockPipeline(failAtStep) {
      try {
        await runStep('step1', async () => { if (failAtStep === 1) throw new Error('step1 fail'); });
        await runStep('step2', async () => { if (failAtStep === 2) throw new Error('step2 fail'); });
        await runStep('step3-move', async () => { moveCalled = true; });
      } catch (_) {}
    }

    // 步骤 1 失败
    moveCalled = false;
    await mockPipeline(1);
    assert('步骤1失败时不调用移动', !moveCalled);

    // 步骤 2 失败
    moveCalled = false;
    await mockPipeline(2);
    assert('步骤2失败时不调用移动', !moveCalled);

    // 全部成功
    moveCalled = false;
    await mockPipeline(99);
    assert('全部成功时调用移动',  moveCalled);
  }

  // ── Part 4: --new 过滤逻辑验证 ───────────────────────────
  console.log('\n── Part 4: --new 过滤逻辑 ───────────────────────────────\n');
  {
    // 模拟 demos/ 和 done/ 文件列表
    const allDemos = ['a.html', 'b.html', 'c.html', 'd.html'];
    const doneSet  = new Set(['b.html', 'd.html']);  // b、d 已处理

    const newFiles = allDemos.filter(f => !doneSet.has(f));
    assert('过滤后只剩未处理文件', newFiles.join(',') === 'a.html,c.html');
    assert('已处理文件被排除', !newFiles.includes('b.html') && !newFiles.includes('d.html'));
    assert('未处理文件全部保留', newFiles.includes('a.html') && newFiles.includes('c.html'));
  }

  // ── Part 5: 真实端到端完整流水线 ─────────────────────────
  console.log('\n── Part 5: 真实端到端流水线 ─────────────────────────────\n');

  const demoSrc = path.join(__dirname, 'demos', 'particle-bg.html');
  if (!fs.existsSync(demoSrc)) {
    console.log('  ⚠ demos/particle-bg.html 不存在，跳过端到端测试');
    console.log('    请先恢复测试文件后重新运行\n');
  } else {
    console.log('  运行：node generate.js --file particle-bg.html\n');
    const t0 = Date.now();
    const result = spawnSync('node', ['generate.js', '--file', 'particle-bg.html'], {
      cwd: __dirname,
      encoding: 'utf8',
      timeout: 120000,   // 2 分钟超时
    });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    const stdout = result.stdout || '';
    const stderr = result.stderr || '';

    console.log(stdout);
    if (stderr && !stderr.includes('ExperimentalWarning')) {
      console.error('STDERR:', stderr.slice(0, 500));
    }

    assert('进程正常退出（code=0）',   result.status === 0,  `exit code: ${result.status}`);
    assert('日志含 1/7 封面生成',      stdout.includes('1/7 封面生成'));
    assert('日志含 2/7 OG Image',      stdout.includes('2/7 OG Image'));
    assert('日志含 3/7 R2 上传',       stdout.includes('3/7 R2 上传'));
    assert('日志含 4/7 HTML 回写',     stdout.includes('4/7 HTML 回写'));
    assert('日志含 5/7 AI 描述',       stdout.includes('5/7 AI 描述'));
    assert('日志含 6/7 D1 写入',       stdout.includes('6/7 D1 写入'));
    assert('日志含 7/7 文件移动',      stdout.includes('7/7 文件移动'));
    assert('日志含 DONE',              stdout.includes('[DONE]'));
    assert('动图封面已生成',           fs.existsSync(path.join(__dirname, 'covers', 'particle-bg.webp')));
    assert('静图封面已生成',           fs.existsSync(path.join(__dirname, 'covers', 'particle-bg-static.webp')));
    assert('OG Image 已生成',          fs.existsSync(path.join(__dirname, 'og', 'particle-bg-og.webp')));
    assert('HTML 已移入 done/',        fs.existsSync(path.join(__dirname, 'demos', 'done', 'particle-bg.html')));
    assert('HTML 不再在 demos/',       !fs.existsSync(path.join(__dirname, 'demos', 'particle-bg.html')));
    assert(`耗时合理（${elapsed}s < 120s）`, Number(elapsed) < 120);

    // 验证回写内容
    const rewritten = fs.readFileSync(
      path.join(__dirname, 'demos', 'done', 'particle-bg.html'), 'utf8'
    );
    assert('回写含 og:image',          rewritten.includes('og:image'));
    assert('回写含 og:image:width',    rewritten.includes('og:image:width'));
    assert('回写含 noindex',           rewritten.includes('noindex'));

    // 恢复 demo 文件供后续使用
    fs.copyFileSync(
      path.join(__dirname, 'demos', 'done', 'particle-bg.html'),
      path.join(__dirname, 'demos', 'particle-bg.html')
    );
    console.log('\n  ✓ particle-bg.html 已恢复到 demos/ 供下次使用');
  }

  // ── 汇总 ────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log(`📊 测试结果：✅ ${passed} 通过  ❌ ${failed} 失败`);
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error('[FATAL]', e); process.exit(1); });
