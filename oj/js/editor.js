'use strict';

// ── GOC-159: disable run/submit when editor empty ─────────────────
function updateRunBtns() {
  const empty = !document.getElementById('code-editor')?.value.trim();
  const r = document.getElementById('btn-run');
  const s = document.getElementById('btn-submit');
  if (r) { r.disabled = empty; r.title = empty ? '请先写代码' : ''; }
  if (s) { s.disabled = empty; s.title = empty ? '请先写代码' : ''; }
}

// ── GOC-175/176: color-picker & param-hint helpers ────────────────
function _hideColorPicker() {
  document.getElementById('color-picker-popup')?.classList.remove('visible');
}
function _checkColorCtx(e) {
  if (e?.key === 'Escape' || e?.key === ')') { _hideColorPicker(); return; }
  const ta = document.getElementById('code-editor');
  if (!ta) return;
  const before = ta.value.substring(0, ta.selectionStart);
  const m = before.match(/\.c\((\d*)$/);
  if (!m) { _hideColorPicker(); return; }
  const popup = document.getElementById('color-picker-popup');
  if (!popup) return;
  const curNum = m[1] !== '' ? parseInt(m[1], 10) : -1;
  popup.querySelectorAll('.cp-swatch').forEach(s => s.classList.toggle('active', parseInt(s.dataset.cidx) === curNum));
  const rect = ta.getBoundingClientRect();
  const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 20;
  const lineNum = ta.value.substring(0, ta.selectionStart).split('\n').length;
  const approxTop = rect.top + lineNum * lineH - ta.scrollTop;
  popup.style.left = (rect.left + 60) + 'px';
  popup.style.top = Math.min(approxTop + 4, rect.bottom - 90) + 'px';
  popup.classList.add('visible');
}
function _hideParamHint() {
  document.getElementById('param-hint-popup')?.classList.remove('visible');
}
const _PARAM_HINTS = {
  fd:         { sig: 'fd( 距离 )',           desc: '向前移动，单位像素' },
  forward:    { sig: 'forward( 距离 )',      desc: '向前移动，单位像素' },
  bk:         { sig: 'bk( 距离 )',           desc: '向后移动，单位像素' },
  back:       { sig: 'back( 距离 )',         desc: '向后移动，单位像素' },
  rt:         { sig: 'rt( 角度 )',           desc: '右转，单位度（如 90）' },
  right:      { sig: 'right( 角度 )',        desc: '右转，单位度' },
  lt:         { sig: 'lt( 角度 )',           desc: '左转，单位度（如 90）' },
  left:       { sig: 'left( 角度 )',         desc: '左转，单位度' },
  w:          { sig: 'w( 线宽 )',            desc: '设置画笔线宽（像素）' },
  width:      { sig: 'width( 线宽 )',        desc: '设置画笔线宽（像素）' },
  goto:       { sig: 'goto( x, y )',        desc: '移动到坐标，原点为画布中心' },
  setx:       { sig: 'setx( x )',           desc: '设置 x 坐标（左负右正）' },
  sety:       { sig: 'sety( y )',           desc: '设置 y 坐标（下负上正）' },
  seth:       { sig: 'seth( 角度 )',         desc: '设置朝向：0=上 90=右 180=下' },
  setheading: { sig: 'setheading( 角度 )',   desc: '设置朝向：0=上 90=右 180=下' },
  circle:     { sig: 'circle( 半径 )',       desc: '以当前位置为圆心画圆' },
  oo:         { sig: 'oo( 半径 [, 颜色] )', desc: '以当前位置为圆心画圆' },
  dot:        { sig: 'dot( 直径 )',          desc: '在当前位置画实心圆点' },
  speed:      { sig: 'speed( 速度 )',        desc: '设置动画速度（1 慢 ~ 10 快）' },
  text:       { sig: 'text( "文字" )',       desc: '在当前位置输出文字' },
  repeat:     { sig: 'repeat( 次数 )',       desc: '重复执行 { } 内代码 N 次' },
};
function _checkParamCtx(e) {
  if (e?.key === 'Escape' || e?.key === ')') { _hideParamHint(); return; }
  const ta = document.getElementById('code-editor');
  if (!ta) return;
  const before = ta.value.substring(0, ta.selectionStart);
  const m = before.match(/\bpen\.(\w+)\([^)]*$/);
  if (!m) { _hideParamHint(); return; }
  const info = _PARAM_HINTS[m[1]];
  if (!info) { _hideParamHint(); return; }
  const popup = document.getElementById('param-hint-popup');
  if (!popup) return;
  document.getElementById('param-hint-sig').textContent = 'pen.' + info.sig;
  document.getElementById('param-hint-desc').textContent = info.desc;
  const rect = ta.getBoundingClientRect();
  popup.classList.add('visible');
  const popupRect = popup.getBoundingClientRect();
  const sideGap = 12;
  const viewportPad = 10;
  const canPlaceRight = rect.right + sideGap + popupRect.width < window.innerWidth - viewportPad;
  const preferredLeft = canPlaceRight
    ? rect.right + sideGap
    : Math.max(viewportPad, rect.right - popupRect.width - 10);
  const preferredTop = Math.max(viewportPad, rect.top + 10);
  popup.style.left = preferredLeft + 'px';
  popup.style.top = Math.min(preferredTop, window.innerHeight - popupRect.height - viewportPad) + 'px';
}

// ── Editor events ──────────────────────────────────────────────────
function bindEditorEvents() {
  const ta = document.getElementById('code-editor');
  const hl = document.getElementById('highlight-layer');

  document.getElementById('btn-run').addEventListener('click', runCode);
  document.getElementById('btn-submit').addEventListener('click', submitCode);
  document.getElementById('btn-clear').addEventListener('click', clearCanvas);
  // GOC-107: Save canvas as PNG
  document.getElementById('btn-save-canvas')?.addEventListener('click', () => {
    const canvas = document.getElementById('goc-canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    const name = currentProblem ? `goc_${currentProblem.id}_${currentProblem.title.replace(/[^\w\u4e00-\u9fa5]/g, '_')}.png` : 'goc_canvas.png';
    a.download = name;
    a.href = canvas.toDataURL('image/png');
    a.click();
  });
  // GOC-109: Jump to line
  document.getElementById('jump-line-input')?.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const lineNum = Math.max(1, parseInt(e.target.value) || 1);
    if (!lineNum) return;
    const ta = document.getElementById('code-editor');
    if (!ta) return;
    const lines = ta.value.split('\n');
    let chars = 0;
    for (let i = 0; i < Math.min(lineNum - 1, lines.length); i++) chars += lines[i].length + 1;
    ta.focus();
    ta.setSelectionRange(chars, chars);
    const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 20;
    ta.scrollTop = Math.max(0, (lineNum - 5) * lineH);
    e.target.value = '';
  });
  // GOC-164: breakpoint toggle on line-number click
  document.getElementById('line-numbers')?.addEventListener('click', e => {
    const span = e.target.closest('[data-line]');
    if (!span) return;
    const n = parseInt(span.dataset.line, 10);
    if (breakpoints.has(n)) breakpoints.delete(n);
    else breakpoints.add(n);
    updateLineNumbers();
  });

  // GOC-082: click result bar to copy error message
  document.getElementById('result-bar')?.addEventListener('click', function(e) {
    // GOC-160: err-line-btn jump takes priority over copy
    if (e.target.classList.contains('err-line-btn')) {
      highlightErrorLine(parseInt(e.target.dataset.line, 10));
      return;
    }
    const bar = document.getElementById('result-bar');
    if (!bar || !bar.style.cursor) return;
    navigator.clipboard?.writeText(bar.textContent).then(() => {
      const orig = bar.textContent;
      bar.textContent = '📋 已复制错误信息';
      setTimeout(() => { bar.textContent = orig; }, 1500);
    });
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!currentProblem) return;
    ta.value = currentProblem.starterCode || '';
    updateHighlight();
    checkIOPanel();
  });
  document.getElementById('btn-hint').addEventListener('click', () => {
    const box = document.getElementById('hint-box');
    if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('btn-ref').addEventListener('click', () => {
    const panel = document.getElementById('ref-panel');
    panel.classList.toggle('hidden');
    document.getElementById('btn-ref').classList.toggle('active');
  });
  // GOC-150: snippet templates toggle
  document.getElementById('btn-snip')?.addEventListener('click', () => {
    buildSnipPanel();
    const panel = document.getElementById('snip-panel');
    const btn = document.getElementById('btn-snip');
    panel.classList.toggle('hidden');
    btn.classList.toggle('active');
  });
  document.getElementById('sol-toggle-btn').addEventListener('click', () => {
    const wrap = document.getElementById('sol-canvas-wrap');
    const btn = document.getElementById('sol-toggle-btn');
    const hidden = wrap.style.display === 'none';
    wrap.style.display = hidden ? '' : 'none';
    btn.textContent = hidden ? '收起' : '展开';
    if (hidden) requestAnimationFrame(syncSolCanvas);
  });
  document.getElementById('speed-group').addEventListener('click', e => {
    const btn = e.target.closest('.speed-btn');
    if (!btn) return;
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSpeed = parseFloat(btn.dataset.speed);
  });

  // GOC-016: Format
  document.getElementById('btn-format').addEventListener('click', () => {
    ta.value = formatCode(ta.value);
    updateHighlight();
  });

  // GOC-001: Step run buttons
  document.getElementById('btn-step').addEventListener('click', initStepRun);
  document.getElementById('btn-continue').addEventListener('click', continueFromStep);
  document.getElementById('btn-step2').addEventListener('click', stepOnce);
  document.getElementById('btn-step-auto').addEventListener('click', continueFromStep);
  document.getElementById('btn-step-exit').addEventListener('click', exitStepMode);

  // GOC-008: IO panel clear
  document.getElementById('io-clear-btn').addEventListener('click', () => {
    const inp = document.getElementById('io-input');
    const out = document.getElementById('io-output');
    if (inp) inp.value = '';
    if (out) out.textContent = '';
  });

  // GOC-014: Syntax highlighting on input
  // GOC-097: auto-save draft code per problem
  let _autoSaveTimer = null;
  function triggerAutoSave() {
    clearTimeout(_autoSaveTimer);
    _autoSaveTimer = setTimeout(() => {
      if (!currentProblem) return;
      const rec = loadRecord(currentProblem.id);
      const status = rec ? rec.status : 'run';
      saveRecord(currentProblem.id, ta.value, status);
      const badge = document.getElementById('autosave-badge');
      if (badge) { badge.textContent = '✓ 已保存'; badge.classList.add('saved'); setTimeout(() => { badge.textContent = ''; badge.classList.remove('saved'); }, 1500); }
    }, 800);
  }
  ta.addEventListener('input', () => {
    updateHighlight();
    checkIOPanel();
    triggerAutoSave();
    updateRunBtns(); // GOC-159
    // GOC-015: Autocomplete trigger
    const before = ta.value.substring(0, ta.selectionStart);
    const m = before.match(/pen\.([a-zA-Z]*)$/);
    if (m) showAutocomplete(ta, m[1]);
    else hideAutocomplete();
  });
  ta.addEventListener('scroll', () => {
    if (hl) { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; }
    const ln = document.getElementById('line-numbers');
    if (ln) ln.scrollTop = ta.scrollTop;
  });

  // GOC-037: bracket auto-pair tables
  const PAIR_OPEN  = { '{':'}', '(':')', '[':']', '"':'"', "'":"'" };
  const PAIR_CLOSE = new Set(['}', ')', ']', '"', "'"]);

  // GOC-015: Keyboard navigation for autocomplete + GOC-037: bracket auto-pair
  ta.addEventListener('keydown', e => {
    const dropdown = document.getElementById('autocomplete');
    if (dropdown.classList.contains('visible')) {
      if (e.key === 'ArrowDown')  { e.preventDefault(); moveAcSelection(1); return; }
      if (e.key === 'ArrowUp')    { e.preventDefault(); moveAcSelection(-1); return; }
      if ((e.key === 'Tab' || e.key === 'Enter') && acFilteredItems.length > 0) {
        e.preventDefault();
        insertAcItem(ta, acFilteredItems[acSelectedIdx]);
        hideAutocomplete();
        return;
      }
      if (e.key === 'Escape') { hideAutocomplete(); return; }
    }

    // GOC-037: auto-pair open brackets
    if (PAIR_OPEN[e.key] !== undefined && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const s = ta.selectionStart, end = ta.selectionEnd;
      const right = PAIR_OPEN[e.key];
      e.preventDefault();
      if (s !== end) {
        // Wrap selection in pair
        const selected = ta.value.substring(s, end);
        ta.value = ta.value.substring(0, s) + e.key + selected + right + ta.value.substring(end);
        ta.selectionStart = s + 1;
        ta.selectionEnd = end + 1;
      } else {
        // Insert pair, cursor between them
        ta.value = ta.value.substring(0, s) + e.key + right + ta.value.substring(s);
        ta.selectionStart = ta.selectionEnd = s + 1;
      }
      updateHighlight();
      return;
    }

    // GOC-037: skip-over closing bracket if already present
    if (PAIR_CLOSE.has(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey &&
        ta.selectionStart === ta.selectionEnd &&
        ta.value[ta.selectionStart] === e.key) {
      e.preventDefault();
      ta.selectionStart = ta.selectionEnd = ta.selectionStart + 1;
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // GOC-080: Shift+Tab de-indent
        const s = ta.selectionStart, end = ta.selectionEnd;
        const lines = ta.value.split('\n');
        let charsBefore = 0, startLine = 0, endLine = 0;
        for (let i = 0; i < lines.length; i++) {
          if (charsBefore + lines[i].length >= s && startLine === 0 && i > 0) startLine = i;
          if (charsBefore <= s && charsBefore + lines[i].length >= s) startLine = i;
          if (charsBefore <= end && charsBefore + lines[i].length >= end) { endLine = i; break; }
          charsBefore += lines[i].length + 1;
        }
        let removed = 0;
        for (let i = startLine; i <= endLine; i++) {
          const orig = lines[i];
          lines[i] = orig.startsWith('    ') ? orig.slice(4) : orig.startsWith('\t') ? orig.slice(1) : orig;
          removed += orig.length - lines[i].length;
        }
        ta.value = lines.join('\n');
        ta.selectionStart = Math.max(0, s - (startLine === endLine ? removed : 0));
        ta.selectionEnd = Math.max(ta.selectionStart, end - removed);
      } else {
        const s = ta.selectionStart, end = ta.selectionEnd;
        ta.value = ta.value.substring(0, s) + '    ' + ta.value.substring(end);
        ta.selectionStart = ta.selectionEnd = s + 4;
      }
      updateHighlight();
    }
    // GOC-169: Enter auto-inherit indent
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      const s = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
      const indent = ta.value.substring(lineStart, s).match(/^(\s*)/)[1];
      if (indent.length > 0) {
        e.preventDefault();
        const selEnd = ta.selectionEnd;
        ta.value = ta.value.substring(0, s) + '\n' + indent + ta.value.substring(selEnd);
        ta.selectionStart = ta.selectionEnd = s + 1 + indent.length;
        updateHighlight();
      }
    }
    // GOC-093: Ctrl+/ toggle line comment
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      const s = ta.selectionStart, end = ta.selectionEnd;
      const lines = ta.value.split('\n');
      let charsBefore = 0, startLine = 0, endLine = 0;
      for (let i = 0; i < lines.length; i++) {
        if (charsBefore <= s && charsBefore + lines[i].length >= s) startLine = i;
        if (charsBefore <= end && charsBefore + lines[i].length >= end) { endLine = i; break; }
        charsBefore += lines[i].length + 1;
      }
      const allCommented = lines.slice(startLine, endLine + 1).every(l => /^\s*\/\//.test(l));
      let delta = 0;
      for (let i = startLine; i <= endLine; i++) {
        if (allCommented) {
          const before = lines[i].length;
          lines[i] = lines[i].replace(/^(\s*)\/\/\s?/, '$1');
          delta -= before - lines[i].length;
        } else {
          lines[i] = '// ' + lines[i];
          delta += 3;
        }
      }
      ta.value = lines.join('\n');
      ta.selectionStart = s + (startLine === endLine ? delta : 0);
      ta.selectionEnd = end + delta;
      updateHighlight();
      return;
    }
  });
  ta.addEventListener('keyup', e => {
    if (e.ctrlKey && e.key === ' ') showAutocomplete(ta, '');
  });
  // GOC-170: layered hint reveal
  document.getElementById('hint-next-btn')?.addEventListener('click', () => {
    if (!currentProblem || !Array.isArray(currentProblem.hints)) return;
    if (_hintIdx >= currentProblem.hints.length) return;
    const item = document.createElement('div');
    item.className = 'hint-reveal-item';
    item.innerHTML = `<strong>提示 ${_hintIdx + 1}：</strong>${escapeHtml(currentProblem.hints[_hintIdx])}`;
    document.getElementById('hint-items')?.appendChild(item);
    _hintIdx++;
    if (_hintIdx >= currentProblem.hints.length) {
      document.getElementById('hint-next-btn').style.display = 'none';
    }
  });
  // GOC-175: color picker trigger
  ta.addEventListener('input',  _checkColorCtx);
  ta.addEventListener('keyup',  _checkColorCtx);
  ta.addEventListener('click',  _checkColorCtx);
  ta.addEventListener('blur',   _hideColorPicker);
  // GOC-176: param hint trigger
  ta.addEventListener('input',  _checkParamCtx);
  ta.addEventListener('keyup',  _checkParamCtx);
  ta.addEventListener('click',  _checkParamCtx);
  ta.addEventListener('blur',   _hideParamHint);
  // GOC-173: canvas crosshair on mouse hover
  (function() {
    const gc = document.getElementById('goc-canvas');
    const cc = document.getElementById('crosshair-canvas');
    if (!gc || !cc) return;
    const W = cc.width, H = cc.height, cx = W / 2, cy = H / 2;
    function clearCross() { cc.getContext('2d').clearRect(0, 0, W, H); }
    gc.addEventListener('mousemove', e => {
      const rect = gc.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      if (px < 0 || py < 0 || px > W || py > H) { clearCross(); return; }
      const ctx = cc.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      const dark = document.body.classList.contains('dark-mode');
      ctx.strokeStyle = dark ? 'rgba(100,160,255,0.35)' : 'rgba(40,60,200,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(Math.round(px) + 0.5, 0); ctx.lineTo(Math.round(px) + 0.5, H);
      ctx.moveTo(0, Math.round(py) + 0.5); ctx.lineTo(W, Math.round(py) + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
      const gx = Math.round(px - cx), gy = Math.round(cy - py);
      const label = `(${gx}, ${gy})`;
      ctx.font = '9px monospace';
      const tw = ctx.measureText(label).width;
      const lx = px + 6 + tw + 4 < W ? px + 6 : px - tw - 10;
      const ly = py + 14 < H - 2 ? py + 14 : py - 4;
      ctx.fillStyle = dark ? 'rgba(18,20,26,0.72)' : 'rgba(248,248,255,0.80)';
      ctx.fillRect(Math.round(lx) - 2, Math.round(ly) - 9, Math.ceil(tw) + 4, 11);
      ctx.fillStyle = dark ? 'rgba(120,170,255,0.92)' : 'rgba(30,50,180,0.85)';
      ctx.fillText(label, Math.round(lx), Math.round(ly));
    });
    gc.addEventListener('mouseleave', clearCross);
  })();
}

// ── GOC-016: Code formatter ────────────────────────────────────────
function formatCode(code) {
  const lines = code.split('\n');
  let indent = 0;
  const result = [];
  for (let raw of lines) {
    const line = raw.trim();
    if (!line) { result.push(''); continue; }
    if (line.startsWith('}')) indent = Math.max(0, indent - 1);
    result.push('    '.repeat(indent) + line);
    if (line.endsWith('{')) indent++;
  }
  return result.join('\n');
}

// ── GOC-150: insertSnippet ─────────────────────────────────────────
function insertSnippet(snippet) {
  const ta = document.getElementById('code-editor');
  if (!ta) return;
  const s = ta.selectionStart, e = ta.selectionEnd;
  ta.value = ta.value.substring(0, s) + snippet + ta.value.substring(e);
  ta.selectionStart = ta.selectionEnd = s + snippet.length;
  ta.focus();
  updateHighlight();
}

// ── GOC-008: cin/cout panel ────────────────────────────────────────
function checkIOPanel() {
  const ta = document.getElementById('code-editor');
  const panel = document.getElementById('io-panel');
  if (!ta || !panel) return;
  if (/\bcin\s*>>/.test(ta.value) || /\bcout\s*<</.test(ta.value)) {
    panel.classList.add('visible');
  }
}

function getInputLines() {
  const el = document.getElementById('io-input');
  return el ? el.value.split('\n').filter(l => l.trim() !== '') : [];
}

function showOutput(lines) {
  const el = document.getElementById('io-output');
  if (el) el.textContent = lines.join('');
}
