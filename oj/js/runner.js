'use strict';

// ── Run code ──────────────────────────────────────────────────────
function runCode() {
  if (!currentProblem) return;
  const code = document.getElementById('code-editor').value;
  // GOC-042: auto-save code on run, preserve existing pass status
  const _existRec = loadRecord(currentProblem.id);
  saveRecord(currentProblem.id, code, _existRec?.status || 'run');
  setResult('running', '执行中…');
  cancelAnimation();
  document.getElementById('step-controls')?.classList.remove('visible');
  const _bc = document.getElementById('btn-continue');
  if (_bc) _bc.style.display = 'none';
  // GOC-174: hide compare on new run
  { const _l = document.getElementById('compare-label'), _c = document.getElementById('compare-cb'), _v = document.getElementById('compare-canvas');
    if (_l) _l.style.display = 'none'; if (_c) _c.checked = false; if (_v) _v.style.display = 'none'; }

  setTimeout(() => {
    try {
      const _t0 = Date.now();
      const result = GOCExecutor.run(code, { inputLines: getInputLines(), stepLimit: 5000 });
      const _execMs = Date.now() - _t0; // GOC-099

      if (result.output && result.output.length > 0) {
        document.getElementById('io-panel')?.classList.add('visible');
        showOutput(result.output);
      }

      if (!result.ok) {
        highlightErrorLine(result.line);
        const isTimeout = result.error.includes('超时') || result.error.includes('超过');
        setResult('error', (result.line ? `❌ 第${result.line}行：` : isTimeout ? '⏱ ' : '❌ 运行错误：') + result.error.replace(/^第 \d+ 行：/, ''));
        return;
      }

      const traj = result.trajectory;
      const canvas = document.getElementById('goc-canvas');
      const ctx = canvas.getContext('2d');
      const fitMode = document.getElementById('fit-mode-cb')?.checked;
      const transform = fitMode ? GOCRenderer.computeFitTransform(traj, canvas.width, canvas.height, 20) : null;

      if (currentSpeed >= 999 || traj.length === 0) {
        GOCRenderer.render(ctx, traj, canvas.width, canvas.height, fitMode);
        setResult('idle', `运行完成，共 ${traj.length} 步（${_execMs}ms）。点击「提交」验证答案。`);
        showDrawDone(traj.length); // GOC-103
        return;
      }

      GOCRenderer.drawBackground(ctx, canvas.width, canvas.height);
      const state = GOCRenderer.createState();
      let idx = 0;
      const delay = Math.round(50 / currentSpeed);
      setResult('running', `动画播放中… (${traj.length} 步)`);

      animState.timer = setInterval(() => {
        if (idx >= traj.length) {
          cancelAnimation();
          setResult('idle', `运行完成，共 ${traj.length} 步（${_execMs}ms）。点击「提交」验证答案。`);
          showDrawDone(traj.length); // GOC-103
          return;
        }
        const batch = Math.max(1, Math.round(currentSpeed));
        for (let b = 0; b < batch && idx < traj.length; b++, idx++) {
          GOCRenderer.applyStep(ctx, traj[idx], state, canvas.width, canvas.height, transform);
        }
        drawTurtleIndicator(state, transform); // GOC-172
      }, delay);

    } catch (e) {
      setResult('error', '❌ 执行异常：' + e.message);
    }
  }, 10);
}

function cancelAnimation() {
  if (animState.timer !== null) { clearInterval(animState.timer); animState.timer = null; }
  drawTurtleIndicator(null, null); // GOC-172: clear turtle indicator
}

// ── Image Judge (GOC-038) ──────────────────────────────────────────
const IMAGE_JUDGE_OPTIONS = { canvasW: 400, canvasH: 400, pixelTolRatio: 0.02, colorTol: 20 };

function createOffscreenCtx(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c.getContext('2d');
}

// Compare two renders using the reference trajectory's fitTransform for both.
function judgeByImage(userTraj, refTraj, opts) {
  const o = Object.assign({}, IMAGE_JUDGE_OPTIONS, opts);
  const refTransform = GOCRenderer.computeFitTransform(refTraj, o.canvasW, o.canvasH, 20);
  const refCtx  = createOffscreenCtx(o.canvasW, o.canvasH);
  const userCtx = createOffscreenCtx(o.canvasW, o.canvasH);
  GOCRenderer.renderWithTransform(refCtx,  refTraj,  o.canvasW, o.canvasH, refTransform);
  GOCRenderer.renderWithTransform(userCtx, userTraj, o.canvasW, o.canvasH, refTransform);
  const refData  = refCtx.getImageData(0, 0, o.canvasW, o.canvasH).data;
  const userData = userCtx.getImageData(0, 0, o.canvasW, o.canvasH).data;
  let drawn = 0, diff = 0;
  for (let i = 0; i < refData.length; i += 4) {
    if (refData[i + 3] < 10 && userData[i + 3] < 10) continue; // both empty
    drawn++;
    if (Math.abs(refData[i]   - userData[i])   > o.colorTol ||
        Math.abs(refData[i+1] - userData[i+1]) > o.colorTol ||
        Math.abs(refData[i+2] - userData[i+2]) > o.colorTol) {
      diff++;
    }
  }
  const base = drawn > 0 ? drawn : o.canvasW * o.canvasH;
  return { pass: diff / base < o.pixelTolRatio, diffRatio: +(diff / base).toFixed(4) };
}

// Try primary expected + acceptedTrajectories, return first pass or the primary fail reason.
function judgeMulti(userTraj, problem, primaryExpected) {
  const allExpected = [primaryExpected, ...(problem.acceptedTrajectories || [])];
  for (const exp of allExpected) {
    const v = GOCJudge.judge(userTraj, exp);
    if (v.pass) return v;
  }
  return GOCJudge.judge(userTraj, primaryExpected);
}

// ── Submit ─────────────────────────────────────────────────────────
function submitCode() {
  const problems = window.PROBLEMS_DATA || [];
  if (!currentProblem) return;
  const code = document.getElementById('code-editor').value;
  setResult('running', '判题中…');
  cancelAnimation();

  setTimeout(() => {
    try {
      ensureExpected(currentProblem);
      const userResult = GOCExecutor.run(code, { inputLines: getInputLines(), stepLimit: 5000 });

      if (userResult.output && userResult.output.length > 0) {
        document.getElementById('io-panel')?.classList.add('visible');
        showOutput(userResult.output);
      }

      if (!userResult.ok) {
        highlightErrorLine(userResult.line);
        setResult('error', (userResult.line ? `❌ 第${userResult.line}行：` : '❌ 运行错误：') + userResult.error.replace(/^第 \d+ 行：/, ''));
        saveRecord(currentProblem.id, code, 'fail');
        renderSidebar(currentFilter, currentTag, currentCurriculum);
        return;
      }

      const canvas = document.getElementById('goc-canvas');
      const ctx = canvas.getContext('2d');
      const fitMode = document.getElementById('fit-mode-cb')?.checked;
      GOCRenderer.render(ctx, userResult.trajectory, canvas.width, canvas.height, fitMode);

      const expected = expectedTrajCache[currentProblem.id];
      if (expected === undefined) { setResult('error', '⚠️ 参考答案执行失败，无法判题。'); return; }

      // Graphic problems default to image_fallback; computation problems use output comparison.
      const isGraphicProblem = expected.length > 0;
      const judgeMode = currentProblem.judgeMode || (isGraphicProblem ? 'image_fallback' : 'output');
      let verdict;

      if (judgeMode === 'image') {
        // 纯图像判题
        const img = judgeByImage(userResult.trajectory, expected, IMAGE_JUDGE_OPTIONS);
        verdict = img.pass
          ? { pass: true,  reason: '图形正确！' }
          : { pass: false, reason: '图形不匹配，请检查你的代码。' };
      } else if (judgeMode === 'image_fallback') {
        // 分层：轨迹优先，图像兜底
        verdict = judgeMulti(userResult.trajectory, currentProblem, expected);
        if (!verdict.pass) {
          const img = judgeByImage(userResult.trajectory, expected, IMAGE_JUDGE_OPTIONS);
          if (img.pass) {
            verdict = { pass: true, reason: '图形正确！你的写法与参考答案不同，但画出的图形一样。' };
          }
        }
      } else if (judgeMode === 'output') {
        // 非图形题：比较 cout 输出
        const inputLines = getInputLines();
        const solResult = GOCExecutor.run(currentProblem.solution || '', { inputLines, stepLimit: 5000 });
        const expectedOut = (solResult.ok ? solResult.output || [] : expectedTrajCache[currentProblem.id + '__output'] || []).map(s => s.trim()).join('\n');
        const userOut = (userResult.output || []).map(s => s.trim()).join('\n');
        if (!expectedOut && !userOut) {
          verdict = { pass: true, reason: '通过！' };
        } else if (userOut === expectedOut) {
          verdict = { pass: true, reason: '输出正确！' };
        } else {
          verdict = { pass: false, reason: `输出不匹配。\n期望：${expectedOut || '(空)'}\n实际：${userOut || '(空)'}` };
        }
      } else {
        // 'trajectory'（默认）：多组轨迹比对
        verdict = judgeMulti(userResult.trajectory, currentProblem, expected);
      }

      if (verdict.pass) {
        setResult('pass', '✅ 通过！' + verdict.reason);
        saveRecord(currentProblem.id, code, 'pass');
        // GOC-153: save best time on pass
        saveBestTime(currentProblem.id, Math.floor((Date.now() - _timerStart) / 1000));
        // GOC-157: reveal solution section on pass
        const _sr = document.getElementById('sol-reveal-section');
        if (_sr && currentProblem?.solution) {
          _sr.style.display = '';
          const _sc = document.getElementById('sol-reveal-content');
          if (_sc && !_sc.innerHTML) {
            _sc.innerHTML = `<pre class="sol-reveal-pre">${highlightCode(currentProblem.solution)}</pre>`;
          }
        }
        // GOC-048: show toast with cumulative count
        const passedCount = problems.filter(p => { const r = loadRecord(p.id); return r && r.status === 'pass'; }).length;
        showToast('🎉 通过！已完成 ' + passedCount + ' / ' + problems.length + ' 题');
        // GOC-075: show passed banner
        const pb = document.getElementById('prob-passed-banner');
        if (pb) pb.classList.add('visible');
        // GOC-104: celebrate animation on canvas
        (function() {
          const wrap = document.getElementById('canvas-wrap');
          if (!wrap) return;
          wrap.querySelectorAll('.celebrate-overlay').forEach(el => el.remove());
          const div = document.createElement('div');
          div.className = 'celebrate-overlay';
          div.textContent = '🏆 通过！';
          wrap.style.position = 'relative';
          wrap.appendChild(div);
          setTimeout(() => div.remove(), 2600);
        })();
      } else {
        setResult('fail', '❌ 未通过：' + verdict.reason);
        saveRecord(currentProblem.id, code, 'fail');
        // GOC-174: show compare button after fail
        const _cmpLabel = document.getElementById('compare-label');
        if (_cmpLabel && currentProblem && expectedTrajCache[currentProblem.id]) {
          _cmpLabel.style.display = 'flex';
        }
      }
      renderSidebar(currentFilter, currentTag, currentCurriculum);
    } catch (e) {
      setResult('error', '❌ 执行异常：' + e.message);
    }
  }, 10);
}
