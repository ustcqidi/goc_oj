'use strict';

// ── Problem view ───────────────────────────────────────────────────
function loadProblem(p, options = {}) {
  const problems = window.PROBLEMS_DATA || [];
  const { forceSidebarRender = false } = options;
  currentProblem = p;
  if (forceSidebarRender || !syncSidebarActiveProblem(p.id)) {
    renderSidebar(currentFilter, currentTag, currentCurriculum);
  }

  const content = document.getElementById('content');
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.remove();

  let view = document.getElementById('prob-panel');
  if (!view) {
    const tpl = document.getElementById('tpl-problem-view');
    const clone = tpl.content.cloneNode(true);
    content.appendChild(clone);
    bindEditorEvents();
    updateRunBtns(); // GOC-159: init state
    buildRefPanel();
    // GOC-031: init resizer after DOM is laid out
    requestAnimationFrame(() => initProbResizer());
  }

  // GOC-088: remember last opened problem
  localStorage.setItem('goc_last_problem', String(p.id));
  document.getElementById('p-title').innerHTML = `<span class="prob-id-badge">#${escapeHtml(p.id)}</span>${escapeHtml(p.title)}`;

  const metaEl = document.getElementById('p-meta');
  // GOC-085: tags are clickable — filter sidebar by tag
  const tagsHtml = (p.tags || []).map(t => `<span class="tag" style="cursor:pointer" data-tag="${escapeHtml(t)}" title="按标签「${escapeHtml(t)}」筛选">${escapeHtml(t)}</span>`).join('');
  metaEl.innerHTML = `<span class="badge ${p.difficulty}">${DIFFICULTY_LABEL[p.difficulty] || p.difficulty}</span>${tagsHtml}`;
  if (p.constraints) metaEl.innerHTML += `<span style="font-size:11px;color:#888;margin-left:4px">· ${escapeHtml(p.constraints)}</span>`;
  // GOC-076: show curriculum tags in problem meta
  const currTags = Object.entries(CURRICULUM_MAP).filter(([, ids]) => ids.includes(p.id)).map(([k]) => k);
  currTags.forEach(ct => { metaEl.innerHTML += `<span class="curr-chip" style="font-size:10px" data-curr="${escapeHtml(ct)}" title="按章节「${escapeHtml(ct)}」筛选">${escapeHtml(ct)}</span>`; });
  // GOC-085: bind click on tags in meta
  metaEl.querySelectorAll('.tag[data-tag]').forEach(el => {
    el.addEventListener('click', () => {
      currentTag = el.dataset.tag;
      document.querySelectorAll('.tag-chip').forEach(c => c.classList.toggle('active', c.dataset.tag === currentTag));
      // open filter collapsible if closed
      const toggle = document.getElementById('filter-toggle');
      const coll = document.getElementById('filter-collapsible');
      if (toggle && !toggle.classList.contains('open')) { toggle.classList.add('open'); coll.classList.add('open'); }
      renderSidebar(currentFilter, currentTag, currentCurriculum);
    });
  });
  metaEl.querySelectorAll('.curr-chip[data-curr]').forEach(el => {
    el.addEventListener('click', () => {
      currentCurriculum = el.dataset.curr;
      document.querySelectorAll('.curr-chip').forEach(c => c.classList.toggle('active', c.dataset.curr === currentCurriculum));
      const toggle = document.getElementById('filter-toggle');
      const coll = document.getElementById('filter-collapsible');
      if (toggle && !toggle.classList.contains('open')) { toggle.classList.add('open'); coll.classList.add('open'); }
      renderSidebar(currentFilter, currentTag, currentCurriculum);
    });
  });

  const descEl = document.getElementById('p-desc');
  descEl.innerHTML = renderMarkdown(p.description) +
    (p.hint ? `<div class="hint-box" id="hint-box" style="display:none"><strong>💡 提示：</strong>${escapeHtml(p.hint)}</div>` : '');
  // GOC-068: scroll description to top on problem switch
  descEl.scrollTop = 0;
  // BUG-004 fix: reset desc collapse state on each problem load
  descEl.style.display = '';
  const _tog = document.getElementById('prob-desc-toggle');
  if (_tog) { _tog.textContent = '▲'; _tog.title = '折叠题目描述'; }

  const editor = document.getElementById('code-editor');
  const rec = loadRecord(p.id);
  // GOC-075: passed banner
  const passedBanner = document.getElementById('prob-passed-banner');
  if (passedBanner) passedBanner.classList.toggle('visible', !!(rec && rec.status === 'pass'));
  editor.value = rec ? rec.code : (p.starterCode || '');
  editor.focus();
  updateHighlight();
  checkIOPanel();
  // Pre-fill defaultInput into the IO panel textarea when loading a problem
  const _ioInput = document.getElementById('io-input');
  if (_ioInput && p.defaultInput != null) _ioInput.value = p.defaultInput;

  cancelAnimation();
  clearCanvas();
  setResult('idle', '准备就绪 — 点击「运行」查看图形，点击「提交」验证答案。');

  document.getElementById('step-controls')?.classList.remove('visible');
  const _bc = document.getElementById('btn-continue');
  if (_bc) _bc.style.display = 'none';

  ensureExpected(p);
  renderSolutionPreview(p);

  // GOC-152: load note for this problem
  const _noteText = loadNote(p.id);
  const _noteTA  = document.getElementById('note-textarea');
  const _noteBtn = document.getElementById('note-toggle-btn');
  const _noteCnt = document.getElementById('note-content');
  const _noteSt  = document.getElementById('note-save-status');
  if (_noteTA) {
    _noteTA.value = _noteText;
    if (_noteSt) _noteSt.textContent = '';
    const hasNote = !!_noteText;
    if (_noteCnt) _noteCnt.style.display = hasNote ? '' : 'none';
    if (_noteBtn) {
      _noteBtn.classList.toggle('has-note', hasNote);
      _noteBtn.textContent = hasNote ? '✏️ 我的笔记 ✓' : '✏️ 我的笔记';
    }
  }

  // GOC-170: layered hints reset
  const _hintSection = document.getElementById('hint-section');
  const _hintItems   = document.getElementById('hint-items');
  const _hintNextBtn = document.getElementById('hint-next-btn');
  _hintIdx = 0;
  if (_hintSection) {
    const _hasHints = Array.isArray(p.hints) && p.hints.length > 0;
    _hintSection.style.display = _hasHints ? '' : 'none';
    if (_hintItems) _hintItems.innerHTML = '';
    if (_hintNextBtn) _hintNextBtn.style.display = _hasHints ? '' : 'none';
  }

  // GOC-174: reset compare on problem switch
  { const _l = document.getElementById('compare-label'), _c = document.getElementById('compare-cb'), _v = document.getElementById('compare-canvas');
    if (_l) _l.style.display = 'none'; if (_c) _c.checked = false; if (_v) _v.style.display = 'none'; }

  // GOC-164: clear breakpoints and step highlight on problem switch
  breakpoints.clear();
  currentStepLineNum = null;
  highlightCurrentStepLine(null);

  // GOC-157: solution reveal section
  const _solSection = document.getElementById('sol-reveal-section');
  const _solContent = document.getElementById('sol-reveal-content');
  const _solRevBtn  = document.getElementById('sol-reveal-btn');
  if (_solSection) {
    const _hasPassed = !!(rec && rec.status === 'pass');
    _solSection.style.display = (_hasPassed && p.solution) ? '' : 'none';
    if (_solContent) { _solContent.style.display = 'none'; }
    if (_solRevBtn)  { _solRevBtn.textContent = '💡 参考解法 ▼'; }
    if (_hasPassed && p.solution && _solContent) {
      _solContent.innerHTML = `<pre class="sol-reveal-pre">${highlightCode(p.solution)}</pre>`;
    }
  }

  updateRunBtns(); // GOC-159

  // GOC-165: related problems recommendation
  (function updateRelated() {
    const _relSection = document.getElementById('related-section');
    const _relDiv = document.getElementById('related-problems');
    if (!_relSection || !_relDiv) return;
    const _related = p.tags && p.tags.length
      ? problems.filter(q => q.id !== p.id && q.tags && q.tags.some(t => p.tags.includes(t))).slice(0, 4)
      : [];
    if (_related.length === 0) { _relSection.style.display = 'none'; return; }
    _relSection.style.display = '';
    _relDiv.innerHTML = _related.map(q => {
      const qrec = loadRecord(q.id);
      const done = qrec?.status === 'pass';
      return `<button class="rel-problem-btn${done ? ' done' : ''}" data-id="${q.id}" title="${escapeHtml(q.title)}">#${q.id} ${escapeHtml(q.title)}${done ? ' ✓' : ''}</button>`;
    }).join('');
  })();
}

function ensureExpected(p) {
  if (expectedTrajCache[p.id] !== undefined) return;
  if (p.expectedTrajectory && p.expectedTrajectory.length > 0) {
    expectedTrajCache[p.id] = p.expectedTrajectory; return;
  }
  let inputLines = [];
  if (p.defaultInput) {
    inputLines = p.defaultInput.split(/\s+/).filter(v => v !== '');
  }
  const result = GOCExecutor.run(p.solution || '', { inputLines, stepLimit: 5000 });
  if (result.ok) {
    expectedTrajCache[p.id] = result.trajectory;
    expectedTrajCache[p.id + '__output'] = result.output || [];
  }
}

// ── Solution preview with fit (GOC-006 + GOC-032) ─────────────────
function renderSolutionPreview(p) {
  // Reuse trajectory already cached by ensureExpected — avoid re-running executor
  currentSolTraj = expectedTrajCache[p.id] || [];
  syncSolCanvas();
}

// GOC-031: Sync sol-canvas dimensions to its container, then re-render
function syncSolCanvas() {
  const wrap = document.getElementById('sol-canvas-wrap');
  const canvas = document.getElementById('sol-canvas');
  if (!wrap || !canvas) return;
  const w = Math.max(80, wrap.clientWidth - 12);
  const h = Math.max(60, wrap.clientHeight - 12);
  canvas.width = w;
  canvas.height = h;
  if (currentSolTraj) {
    GOCRenderer.render(canvas.getContext('2d'), currentSolTraj, w, h, true);
  }
}

// GOC-031: Draggable resizer between prob-desc and sol-preview
function initProbResizer() {
  const panel   = document.getElementById('prob-panel');
  const desc    = document.getElementById('p-desc');
  const resizer = document.getElementById('prob-resizer');
  if (!panel || !desc || !resizer) return;

  // Set initial height from current panel size (38% approx)
  const initH = Math.round(panel.clientHeight * 0.38);
  desc.style.height = initH + 'px';

  // ResizeObserver: re-render canvas whenever wrap size changes
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => syncSolCanvas());
    const wrap = document.getElementById('sol-canvas-wrap');
    if (wrap) ro.observe(wrap);
  }

  let dragging = false, startY = 0, startH = 0;

  resizer.addEventListener('mousedown', e => {
    dragging = true;
    startY = e.clientY;
    startH = desc.clientHeight;
    resizer.classList.add('dragging');
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  // Touch support
  resizer.addEventListener('touchstart', e => {
    dragging = true;
    startY = e.touches[0].clientY;
    startH = desc.clientHeight;
    resizer.classList.add('dragging');
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dy = e.clientY - startY;
    const maxH = panel.clientHeight - 120;
    desc.style.height = Math.max(60, Math.min(maxH, startH + dy)) + 'px';
  });

  document.addEventListener('touchmove', e => {
    if (!dragging) return;
    const dy = e.touches[0].clientY - startY;
    const maxH = panel.clientHeight - 120;
    desc.style.height = Math.max(60, Math.min(maxH, startH + dy)) + 'px';
  }, { passive: true });

  const stopDrag = () => {
    if (!dragging) return;
    dragging = false;
    resizer.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    syncSolCanvas();
  };
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchend', stopDrag);
}

// ── Build instruction reference panel ─────────────────────────────
function buildRefPanel() {
  const panel = document.getElementById('ref-panel');
  if (!panel) return;
  const colorRow = document.createElement('div');
  colorRow.className = 'ref-colors';
  colorRow.innerHTML = '<span class="rc-label">颜色：</span>';
  GOCRenderer.GOC_COLORS.forEach((hex, i) => {
    const sw = document.createElement('span');
    sw.className = 'color-swatch';
    sw.innerHTML = `<span class="swatch" style="background:${hex}"></span>${i}`;
    sw.title = hex;
    colorRow.appendChild(sw);
  });
  panel.appendChild(colorRow);

  REF_INSTRUCTIONS.forEach(section => {
    const secEl = document.createElement('div');
    secEl.className = 'ref-section';
    secEl.innerHTML = `<div class="ref-section-title">${section.category}</div>`;
    const itemsEl = document.createElement('div');
    itemsEl.className = 'ref-items';
    section.items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'ref-item';
      el.innerHTML = `<code>${escapeHtml(item.code)}</code><span class="ref-desc">${escapeHtml(item.desc)}</span><button class="insert-btn">插入</button>`;
      el.querySelector('.insert-btn').addEventListener('click', () => insertSnippet(item.snippet));
      itemsEl.appendChild(el);
    });
    secEl.appendChild(itemsEl);
    panel.appendChild(secEl);
  });
}

// GOC-150: build snippet template panel (lazy, once)
function buildSnipPanel() {
  const panel = document.getElementById('snip-panel');
  if (!panel || panel.dataset.built) return;
  panel.dataset.built = '1';
  SNIPPET_TEMPLATES.forEach(tpl => {
    const card = document.createElement('div');
    card.className = 'snip-card';
    card.innerHTML = `<span class="snip-card-name">${escapeHtml(tpl.name)}</span>
      <span class="snip-card-desc">${escapeHtml(tpl.desc)}</span>
      <button class="snip-insert-btn">插入</button>`;
    card.querySelector('.snip-insert-btn').addEventListener('click', () => {
      insertSnippet(tpl.code);
      document.getElementById('snip-panel').classList.add('hidden');
      document.getElementById('btn-snip').classList.remove('active');
    });
    panel.appendChild(card);
  });
}
