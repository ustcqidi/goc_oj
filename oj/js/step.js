'use strict';

// ── GOC-001: Step Run ─────────────────────────────────────────────
function initStepRun() {
  if (!currentProblem) return;
  const code = document.getElementById('code-editor').value;
  const result = GOCExecutor.run(code, { inputLines: getInputLines(), stepLimit: 5000 });
  if (!result.ok) {
    highlightErrorLine(result.line);
    setResult('error', (result.line ? `❌ 第${result.line}行：` : '❌ 运行错误：') + result.error.replace(/^第 \d+ 行：/, ''));
    return;
  }
  cancelAnimation();
  const canvas = document.getElementById('goc-canvas');
  stepCtx = canvas.getContext('2d');
  stepTraj = result.trajectory;
  stepIdx = 0;
  stepState = GOCRenderer.createState();
  const fitMode = document.getElementById('fit-mode-cb')?.checked;
  stepTransform = fitMode ? GOCRenderer.computeFitTransform(stepTraj, canvas.width, canvas.height, 20) : null;
  GOCRenderer.drawBackground(stepCtx, canvas.width, canvas.height);
  document.getElementById('step-controls').classList.add('visible');
  const _bc = document.getElementById('btn-continue');
  if (_bc) _bc.style.display = '';
  updateStepPos();
  // GOC-164: highlight first step's line on entering step mode
  currentStepLineNum = stepTraj[0]?.line || null;
  highlightCurrentStepLine(currentStepLineNum);
  updateLineNumbers();
  setResult('running', `单步模式 — 共 ${stepTraj.length} 步，按「下一步」逐条执行。`);
}

function stepOnce() {
  if (stepIdx >= stepTraj.length) { setResult('idle', `单步完成，共 ${stepTraj.length} 步。`); return; }
  const canvas = document.getElementById('goc-canvas');
  GOCRenderer.applyStep(stepCtx, stepTraj[stepIdx], stepState, canvas.width, canvas.height, stepTransform);
  stepIdx++;
  updateStepPos();
  // GOC-164: highlight current execution line
  currentStepLineNum = stepTraj[stepIdx - 1]?.line || null;
  highlightCurrentStepLine(currentStepLineNum);
  updateLineNumbers();
  drawTurtleIndicator(stepState, stepTransform); // GOC-172
  if (stepIdx >= stepTraj.length) setResult('idle', `单步完成，共 ${stepTraj.length} 步。`);
}

function continueFromStep() {
  if (stepTraj.length === 0) return;
  const canvas = document.getElementById('goc-canvas');
  const delay = Math.round(50 / currentSpeed);
  const _resumeIdx = stepIdx; // GOC-164: skip bp check for the step we resume from
  animState.timer = setInterval(() => {
    if (stepIdx >= stepTraj.length) {
      cancelAnimation();
      currentStepLineNum = null; highlightCurrentStepLine(null); updateLineNumbers();
      setResult('idle', `运行完成，共 ${stepTraj.length} 步。`);
      return;
    }
    const batch = Math.max(1, Math.round(currentSpeed));
    for (let b = 0; b < batch && stepIdx < stepTraj.length; b++, stepIdx++) {
      // GOC-164: pause at breakpoint (skip the step index we just resumed from)
      if (breakpoints.size > 0 && stepIdx !== _resumeIdx && breakpoints.has(stepTraj[stepIdx]?.line)) {
        cancelAnimation();
        currentStepLineNum = stepTraj[stepIdx].line;
        highlightCurrentStepLine(currentStepLineNum);
        updateLineNumbers();
        updateStepPos();
        setResult('running', `⏸ 断点暂停在第 ${stepTraj[stepIdx].line} 行，按「下一步」或「继续」`);
        return;
      }
      GOCRenderer.applyStep(stepCtx, stepTraj[stepIdx], stepState, canvas.width, canvas.height, stepTransform);
    }
    updateStepPos();
    drawTurtleIndicator(stepState, stepTransform); // GOC-172
  }, delay);
  setResult('running', `动画播放中… (${stepTraj.length} 步)`);
}

function exitStepMode() {
  cancelAnimation();
  stepTraj = []; stepIdx = 0;
  // GOC-164: clear step debug state
  currentStepLineNum = null;
  highlightCurrentStepLine(null);
  updateLineNumbers();
  document.getElementById('step-controls').classList.remove('visible');
  const _bc = document.getElementById('btn-continue');
  if (_bc) _bc.style.display = 'none';
  clearCanvas();
  setResult('idle', '准备就绪 — 点击「运行」查看图形，点击「提交」验证答案。');
}

function updateStepPos() {
  const el = document.getElementById('step-pos');
  if (el) el.textContent = stepIdx + ' / ' + stepTraj.length;
  // GOC-074: step progress bar
  const fill = document.getElementById('step-progress-fill');
  if (fill) fill.style.width = (stepTraj.length ? Math.round(stepIdx / stepTraj.length * 100) : 0) + '%';
}

// ── GOC-172: Turtle direction indicator ───────────────────────────
function drawTurtleIndicator(state, transform) {
  const tc = document.getElementById('turtle-canvas');
  if (!tc) return;
  const ctx = tc.getContext('2d');
  ctx.clearRect(0, 0, tc.width, tc.height);
  if (!state) { tc.style.display = 'none'; return; }
  tc.style.display = '';
  const cx = transform ? transform.tx : tc.width / 2;
  const cy = transform ? transform.ty : tc.height / 2;
  const scale = transform ? transform.scale : 1;
  const px = cx + state.x * scale;
  const py = cy - state.y * scale;
  const headingRad = state.heading * Math.PI / 180;
  const dx = Math.sin(headingRad), dy = -Math.cos(headingRad);
  const L = 15, W = 9, tail = 5;
  const dark = document.body.classList.contains('dark-mode');
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(px + dx * L, py + dy * L);
  ctx.lineTo(px - dx * tail - dy * W, py - dy * tail + dx * W);
  ctx.lineTo(px - dx * 3, py - dy * 3);
  ctx.lineTo(px - dx * tail + dy * W, py - dy * tail - dx * W);
  ctx.closePath();
  ctx.fillStyle = dark ? 'rgba(120,190,255,0.96)' : 'rgba(30,90,255,0.92)';
  ctx.strokeStyle = dark ? 'rgba(7,15,35,0.95)' : 'rgba(255,255,255,0.96)';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = dark ? 'rgba(0,0,0,0.45)' : 'rgba(40,70,180,0.28)';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(px, py, 3.2, 0, Math.PI * 2);
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.95)' : 'rgba(11,26,84,0.92)';
  ctx.fill();
}

// ── GOC-164: Step execution line highlight ─────────────────────────
function highlightCurrentStepLine(lineNum) {
  const hl = document.getElementById('highlight-layer');
  hl?.querySelectorAll('.step-line-highlight').forEach(el => el.remove());
  if (!lineNum) return;
  const ta = document.getElementById('code-editor');
  if (!ta || !hl) return;
  const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 20;
  const paddingTop = parseFloat(getComputedStyle(ta).paddingTop) || 12;
  const div = document.createElement('div');
  div.className = 'step-line-highlight';
  div.style.top = (paddingTop + (lineNum - 1) * lineH) + 'px';
  div.style.height = lineH + 'px';
  hl.appendChild(div);
  // Scroll to keep current line visible
  const scrollTarget = Math.max(0, (lineNum - 4) * lineH);
  ta.scrollTop = scrollTarget;
  hl.scrollTop = scrollTarget;
  const ln = document.getElementById('line-numbers');
  if (ln) ln.scrollTop = scrollTarget;
}

// ── Error highlight (GOC-096 enhanced) ────────────────────────────
function highlightErrorLine(lineNum) {
  const hl = document.getElementById('highlight-layer');
  hl?.querySelectorAll('.error-line-highlight').forEach(el => el.remove());
  if (!lineNum) return;
  const ta = document.getElementById('code-editor');
  if (!ta) return;
  const lines = ta.value.split('\n');
  let start = 0;
  for (let i = 0; i < lineNum - 1 && i < lines.length; i++) start += lines[i].length + 1;
  const end = start + (lines[lineNum - 1] || '').length;
  ta.focus();
  ta.setSelectionRange(start, end);
  const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 20;
  const paddingTop = parseFloat(getComputedStyle(ta).paddingTop) || 4;
  ta.scrollTop = (lineNum - 3) * lineH;
  // GOC-096: visual red-tint overlay on error line
  if (hl) {
    const div = document.createElement('div');
    div.className = 'error-line-highlight';
    div.style.top = (paddingTop + (lineNum - 1) * lineH) + 'px';
    div.style.height = lineH + 'px';
    hl.appendChild(div);
  }
}
