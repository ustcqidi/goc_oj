'use strict';

// ── Canvas ─────────────────────────────────────────────────────────
// GOC-103: Show draw-complete overlay on canvas
function showDrawDone(steps) {
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  wrap.querySelectorAll('.draw-done-overlay').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'draw-done-overlay';
  div.textContent = `🎨 绘制完成（${steps} 步）`;
  wrap.style.position = 'relative';
  wrap.appendChild(div);
  setTimeout(() => div.remove(), 2200);
}

function clearCanvas() {
  cancelAnimation();
  const canvas = document.getElementById('goc-canvas');
  if (!canvas) return;
  GOCRenderer.drawBackground(canvas.getContext('2d'), canvas.width, canvas.height);
  setResult('idle', '准备就绪 — 点击「运行」查看图形，点击「提交」验证答案。');
  // GOC-065: flash feedback
  const wrap = canvas.parentElement;
  if (wrap) { wrap.classList.add('flash'); setTimeout(() => wrap.classList.remove('flash'), 400); }
}

function setResult(type, msg) {
  const bar = document.getElementById('result-bar');
  if (!bar) return;
  bar.className = 'result-bar ' + type;
  // GOC-082: click to copy for error/fail states
  if (type === 'error' || type === 'fail') {
    bar.title = '点击复制错误信息';
    bar.style.cursor = 'pointer';
  } else {
    bar.title = '';
    bar.style.cursor = '';
  }
  // GOC-160: render clickable line-number for error type
  if (type === 'error') {
    const _m = msg.match(/^(❌ )第(\d+)行：(.*)$/s);
    if (_m) {
      bar.innerHTML = escapeHtml(_m[1]) + '<button class="err-line-btn" data-line="' + _m[2] + '">第' + _m[2] + '行</button>：' + escapeHtml(_m[3]);
    } else {
      bar.textContent = msg;
    }
  } else {
    bar.textContent = msg;
  }
  // GOC-096: clear error highlight when not error
  if (type !== 'error') highlightErrorLine(null);
  // GOC-070: disable run/submit during execution
  const isRunning = type === 'running';
  const btnRun = document.getElementById('btn-run');
  const btnSubmit = document.getElementById('btn-submit');
  if (btnRun) btnRun.disabled = isRunning;
  if (btnSubmit) btnSubmit.disabled = isRunning;
  if (btnRun) btnRun.style.opacity = isRunning ? '0.5' : '';
  if (btnSubmit) btnSubmit.style.opacity = isRunning ? '0.5' : '';
}

// ── GOC-168: canvas grid overlay ──────────────────────────────────
function drawGrid() {
  const gridCanvas = document.getElementById('grid-canvas');
  const cb = document.getElementById('grid-cb');
  if (!gridCanvas) return;
  const show = cb?.checked;
  gridCanvas.style.display = show ? '' : 'none';
  if (!show) return;
  const W = gridCanvas.width, H = gridCanvas.height;
  const ctx = gridCanvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const step = 40, cx = W / 2, cy = H / 2;
  const dark = document.body.classList.contains('dark-mode');
  // Regular grid lines
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = cx % step; x <= W; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
  for (let y = cy % step; y <= H; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
  ctx.stroke();
  // Center axes — more prominent
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 0.5, 0); ctx.lineTo(cx + 0.5, H);
  ctx.moveTo(0, cy + 0.5); ctx.lineTo(W, cy + 0.5);
  ctx.stroke();
}

// ── GOC-171: canvas ruler overlay ────────────────────────────────
function drawRuler() {
  const rc = document.getElementById('ruler-canvas');
  const cb = document.getElementById('ruler-cb');
  if (!rc) return;
  const show = cb?.checked;
  rc.style.display = show ? '' : 'none';
  if (!show) return;
  const W = rc.width, H = rc.height, cx = W / 2, cy = H / 2, step = 40;
  const ctx = rc.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const dark = document.body.classList.contains('dark-mode');
  const fg = dark ? 'rgba(200,215,255,0.65)' : 'rgba(50,55,80,0.55)';
  const bg = dark ? 'rgba(20,22,28,0.62)'    : 'rgba(248,248,255,0.68)';
  ctx.font = '8px monospace';
  ctx.lineWidth = 1;
  ctx.strokeStyle = fg;
  // X ruler (top edge)
  ctx.textAlign = 'center';
  for (let gx = -Math.floor(cx / step) * step; gx <= cx; gx += step) {
    const px = cx + gx;
    if (px < 2 || px > W - 2) continue;
    ctx.beginPath(); ctx.moveTo(px + 0.5, 0); ctx.lineTo(px + 0.5, 5); ctx.stroke();
    const label = String(gx);
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = bg;
    ctx.fillRect(Math.round(px - tw / 2) - 1, 5, Math.ceil(tw) + 2, 9);
    ctx.fillStyle = fg;
    ctx.fillText(label, px, 13);
  }
  // Y ruler (left edge)
  ctx.textAlign = 'left';
  for (let gy = -Math.floor((H - cy) / step) * step; gy <= cy; gy += step) {
    const py = cy - gy;
    if (py < 2 || py > H - 2) continue;
    ctx.beginPath(); ctx.moveTo(0, py + 0.5); ctx.lineTo(5, py + 0.5); ctx.stroke();
    const label = String(gy);
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = bg;
    ctx.fillRect(5, Math.round(py - 4), Math.ceil(tw) + 2, 9);
    ctx.fillStyle = fg;
    ctx.fillText(label, 5, py + 3);
  }
}

// ── GOC-174: compare overlay ──────────────────────────────────────
function drawCompare() {
  const cc = document.getElementById('compare-canvas');
  const cb = document.getElementById('compare-cb');
  if (!cc) return;
  const show = cb?.checked;
  cc.style.display = show ? '' : 'none';
  if (!show) { cc.getContext('2d').clearRect(0, 0, cc.width, cc.height); return; }
  const expected = currentProblem && expectedTrajCache[currentProblem.id];
  if (!expected || !expected.length) { cc.style.display = 'none'; return; }
  const ctx = cc.getContext('2d');
  ctx.clearRect(0, 0, cc.width, cc.height); // transparent — no drawBackground
  const fitMode = document.getElementById('fit-mode-cb')?.checked;
  const transform = fitMode ? GOCRenderer.computeFitTransform(expected, cc.width, cc.height, 20) : null;
  const state = GOCRenderer.createState();
  for (const step of expected) {
    GOCRenderer.applyStep(ctx, step, state, cc.width, cc.height, transform);
  }
}
