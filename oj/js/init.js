'use strict';

// ── Init ───────────────────────────────────────────────────────────
function init() {
  const problems = window.PROBLEMS_DATA || [];
  if (!problems || problems.length === 0) {
    document.getElementById('problem-list').innerHTML = '<div style="padding:20px;color:#888;font-size:13px">题目数据加载失败，请确认 data/problems.js 存在。</div>';
    return;
  }
  initTagFilter();
  initCurriculumFilter();
  // GOC-064: difficulty counts on filter buttons
  // GOC-089: update diff filter buttons with pass/total
  function updateDiffCounts() {
    const counts = { easy: 0, medium: 0, hard: 0 };
    const passed = { easy: 0, medium: 0, hard: 0, all: 0 };
    problems.forEach(p => {
      if (counts[p.difficulty] !== undefined) counts[p.difficulty]++;
      const r = loadRecord(p.id);
      if (r && r.status === 'pass') {
        if (passed[p.difficulty] !== undefined) passed[p.difficulty]++;
        passed.all++;
      }
    });
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
      const f = btn.dataset.filter;
      if (f === 'all') { btn.textContent = '全部 ' + passed.all + '/' + problems.length; return; }
      if (counts[f] !== undefined) {
        const label = { easy: '⭐ 入门', medium: '🔥 进阶', hard: '💎 高级' }[f] || f;
        btn.textContent = label + ' ' + passed[f] + '/' + counts[f];
      }
    });
  }
  updateDiffCounts();
  // GOC-094: status filter counts
  function updateStatusCounts() {
    const counts = { all: problems.length, todo: 0, pass: 0, fail: 0 };
    problems.forEach(p => {
      const r = loadRecord(p.id);
      if (!r || r.status === 'run') counts.todo++;
      else if (r.status === 'pass') counts.pass++;
      else counts.fail++;
    });
    document.querySelectorAll('.status-btn[data-status]').forEach(btn => {
      const s = btn.dataset.status;
      const labels = { all: '全部', todo: '未做', pass: '已通过', fail: '未通过' };
      if (labels[s] !== undefined) btn.textContent = labels[s] + ' ' + counts[s];
    });
  }
  updateStatusCounts();
  renderSidebar('all', 'all', 'all');
  if (problems.length > 0) {
    const lastId = localStorage.getItem('goc_last_problem');
    const lastProblem = lastId && problems.find(p => String(p.id) === String(lastId));
    loadProblem(lastProblem || problems[0]);
  }

  // GOC-043: Prev / Next navigation
  function updateNavBtns() {
    const idx = problems.indexOf(currentProblem);
    const prev = document.getElementById('btn-prev');
    const next = document.getElementById('btn-next');
    if (prev) prev.disabled = idx <= 0;
    if (next) next.disabled = idx < 0 || idx >= problems.length - 1;
    // GOC-087: update N / Total counter
    const counter = document.getElementById('prob-nav-counter');
    if (counter && idx >= 0) counter.textContent = (idx + 1) + ' / ' + problems.length;
  }
  document.addEventListener('click', e => {
    if (e.target.id === 'btn-prev' && currentProblem) {
      const idx = problems.indexOf(currentProblem);
      if (idx > 0) loadProblem(problems[idx - 1]);
    }
    if (e.target.id === 'btn-next' && currentProblem) {
      const idx = problems.indexOf(currentProblem);
      if (idx < problems.length - 1) loadProblem(problems[idx + 1]);
    }
  });
  // Patch loadProblem to update nav buttons after each load
  const _origLoad = loadProblem;
  loadProblem = function(p) { _origLoad(p); updateNavBtns(); };
  updateNavBtns();

  // GOC-044: Random problem (prefer unfinished)
  function pickRandom() {
    const unfinished = problems.filter(p => { const r = loadRecord(p.id); return !r || r.status !== 'pass'; });
    const pool = unfinished.length > 0 ? unfinished : problems;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) loadProblem(pick);
  }
  document.getElementById('btn-random')?.addEventListener('click', pickRandom);
  // GOC-088: welcome screen quick actions
  document.getElementById('ws-btn-random')?.addEventListener('click', pickRandom);
  document.getElementById('ws-btn-continue')?.addEventListener('click', () => {
    // find last attempted (most recent by localStorage key, fallback to first unsolved)
    const lastId = localStorage.getItem('goc_last_problem');
    const lastP = lastId && problems.find(p => String(p.id) === String(lastId));
    if (lastP) { loadProblem(lastP); return; }
    const unsolved = problems.find(p => { const r = loadRecord(p.id); return !r || r.status !== 'pass'; });
    if (unsolved) loadProblem(unsolved); else if (problems.length) loadProblem(problems[0]);
  });

  // GOC-047: Copy code
  document.getElementById('btn-copy')?.addEventListener('click', () => {
    const code = document.getElementById('code-editor')?.value || '';
    const btn = document.getElementById('btn-copy');
    const copy = () => { btn.textContent = '✅ 已复制'; setTimeout(() => { btn.textContent = '📋 复制'; }, 2000); };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(copy).catch(() => {});
    } else {
      const ta = document.createElement('textarea');
      ta.value = code; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); copy(); } catch {}
      document.body.removeChild(ta);
    }
  });

  // GOC-091: Problem timer
  let _timerInterval = null;
  _timerStart = Date.now();
  function startProbTimer() {
    _timerStart = Date.now();
    clearInterval(_timerInterval);
    const el = document.getElementById('prob-timer');
    if (!el) return;
    _timerInterval = setInterval(() => {
      const sec = Math.floor((Date.now() - _timerStart) / 1000);
      const m = Math.floor(sec / 60), s = sec % 60;
      el.textContent = m + ':' + String(s).padStart(2, '0');
    }, 1000);
  }
  // Patch loadProblem to start timer
  const _loadForTimer = loadProblem;
  loadProblem = function(p) { _loadForTimer(p); startProbTimer(); };
  startProbTimer();

  // GOC-092: Collapsible prob-desc
  document.addEventListener('click', e => {
    if (e.target.id === 'prob-desc-toggle') {
      const desc = document.getElementById('p-desc');
      const btn = e.target;
      if (!desc) return;
      const collapsed = desc.style.display === 'none';
      desc.style.display = collapsed ? '' : 'none';
      btn.textContent = collapsed ? '▲' : '▼';
      btn.title = collapsed ? '折叠题目描述' : '展开题目描述';
    }
    // GOC-152: note toggle
    if (e.target.id === 'note-toggle-btn') {
      const c = document.getElementById('note-content');
      if (!c) return;
      const open = c.style.display === 'none';
      c.style.display = open ? '' : 'none';
      if (open) document.getElementById('note-textarea')?.focus();
    }
    // GOC-157: solution reveal toggle
    if (e.target.id === 'sol-reveal-btn') {
      const c = document.getElementById('sol-reveal-content');
      const btn = e.target;
      if (!c) return;
      const open = c.style.display === 'none';
      c.style.display = open ? '' : 'none';
      btn.textContent = open ? '💡 参考解法 ▲' : '💡 参考解法 ▼';
    }
    // GOC-165: related problem jump
    if (e.target.classList.contains('rel-problem-btn')) {
      const targetId = e.target.dataset.id;
      const targetP = problems.find(q => String(q.id) === String(targetId));
      if (targetP) loadProblem(targetP);
    }
  });

  // GOC-152: note auto-save (debounced 500ms)
  let _noteSaveTimer = null;
  document.addEventListener('input', e => {
    if (e.target.id !== 'note-textarea' || !currentProblem) return;
    clearTimeout(_noteSaveTimer);
    const st = document.getElementById('note-save-status');
    if (st) st.textContent = '';
    _noteSaveTimer = setTimeout(() => {
      const text = e.target.value.trim();
      saveNote(currentProblem.id, text);
      const btn = document.getElementById('note-toggle-btn');
      const hasNote = !!text;
      if (btn) { btn.classList.toggle('has-note', hasNote); btn.textContent = hasNote ? '✏️ 我的笔记 ✓' : '✏️ 我的笔记'; }
      if (st) { st.textContent = '已保存 ✓'; setTimeout(() => { if (st) st.textContent = ''; }, 2000); }
    }, 500);
  });

  // GOC-090: Dark mode toggle
  (function initDarkMode() {
    const btn = document.getElementById('dark-toggle-btn');
    const isDark = localStorage.getItem('goc_dark_mode') === '1';
    if (isDark) { document.body.classList.add('dark-mode'); if (btn) btn.textContent = '☀️ 浅色'; }
    btn?.addEventListener('click', () => {
      const on = document.body.classList.toggle('dark-mode');
      localStorage.setItem('goc_dark_mode', on ? '1' : '0');
      btn.textContent = on ? '☀️ 浅色' : '🌙 深色';
      drawGrid();    // GOC-168: re-render grid with updated dark/light colors
      drawRuler();   // GOC-171
      drawCompare(); // GOC-174
    });
  })();

  document.getElementById('grid-cb')?.addEventListener('change', e => {
    localStorage.setItem('goc_grid', e.target.checked ? '1' : '0');
    drawGrid();
  });

  // Restore grid preference
  if (localStorage.getItem('goc_grid') === '1') {
    const _gcb = document.getElementById('grid-cb');
    if (_gcb) { _gcb.checked = true; drawGrid(); }
  }

  document.getElementById('ruler-cb')?.addEventListener('change', e => {
    localStorage.setItem('goc_ruler', e.target.checked ? '1' : '0');
    drawRuler();
  });
  if (localStorage.getItem('goc_ruler') === '1') {
    const _rcb = document.getElementById('ruler-cb');
    if (_rcb) { _rcb.checked = true; drawRuler(); }
  }

  document.getElementById('compare-cb')?.addEventListener('change', drawCompare);

  // GOC-175: build color picker swatches once
  (function buildColorPicker() {
    const popup = document.getElementById('color-picker-popup');
    if (!popup || popup.children.length > 0) return;
    const lightFor = new Set([5, 13, 14, 15]);
    GOCRenderer.GOC_COLORS.forEach((hex, i) => {
      const sw = document.createElement('div');
      sw.className = 'cp-swatch';
      sw.style.background = hex;
      sw.style.color = lightFor.has(i) ? '#333' : '#fff';
      sw.textContent = i;
      sw.dataset.cidx = String(i);
      popup.appendChild(sw);
    });
    popup.addEventListener('mousedown', e => {
      const sw = e.target.closest('.cp-swatch');
      if (!sw) return;
      e.preventDefault();
      const ta = document.getElementById('code-editor');
      if (!ta) return;
      const before = ta.value.substring(0, ta.selectionStart);
      const m = before.match(/\.c\((\d*)$/);
      if (!m) return;
      const num = sw.dataset.cidx;
      const replaceStart = ta.selectionStart - m[1].length;
      ta.value = ta.value.substring(0, replaceStart) + num + ta.value.substring(ta.selectionStart);
      ta.selectionStart = ta.selectionEnd = replaceStart + num.length;
      updateHighlight();
      _hideColorPicker();
      ta.focus();
    });
  })();

  // GOC-050: Collapsible filters toggle
  document.getElementById('filter-toggle')?.addEventListener('click', () => {
    const toggle = document.getElementById('filter-toggle');
    const collapsible = document.getElementById('filter-collapsible');
    toggle.classList.toggle('open');
    collapsible.classList.toggle('open');
  });

  // GOC-049: Clear all progress
  const PREF_KEYS = ['goc_dark_mode','goc_fontSize','goc_fontFamily','goc_sidebar_collapsed','goc_last_problem','goc_grid','goc_ruler'];

  document.getElementById('btn-clear-progress')?.addEventListener('click', () => {
    if (!confirm('清空本机所有练习记录？此操作不可恢复。')) return;
    Object.keys(localStorage).filter(k => k.startsWith('goc_') && !PREF_KEYS.includes(k)).forEach(k => localStorage.removeItem(k));
    renderSidebar(currentFilter, currentTag, currentCurriculum);
    updateProgress(); updateDiffCounts(); updateStatusCounts();
  });

  // GOC-151: Progress backup / restore
  function exportProgress() {
    const data = {};
    Object.keys(localStorage)
      .filter(k => k.startsWith('goc_') && !PREF_KEYS.includes(k))
      .forEach(k => { data[k] = localStorage.getItem(k); });
    const today = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const blob = new Blob([JSON.stringify({ version:1, exportDate:today, data }, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'goc-backup-' + today + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importProgress(file) {
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const obj = JSON.parse(ev.target.result);
        if (!obj.data || typeof obj.data !== 'object') { alert('文件格式无效。'); return; }
        const count = Object.keys(obj.data).length;
        if (!confirm('将导入 ' + count + ' 条记录，覆盖本机现有进度，继续？')) return;
        Object.entries(obj.data).forEach(([k, v]) => {
          if (k.startsWith('goc_') && !PREF_KEYS.includes(k)) localStorage.setItem(k, v);
        });
        renderSidebar(currentFilter, currentTag, currentCurriculum);
        updateProgress(); updateDiffCounts(); updateStatusCounts();
        alert('✅ 已恢复 ' + count + ' 条记录。');
      } catch { alert('读取文件失败，请确认是有效的 GOC 备份文件。'); }
    };
    reader.readAsText(file);
  }

  document.getElementById('btn-backup')?.addEventListener('click', exportProgress);
  document.getElementById('btn-restore')?.addEventListener('click', () => {
    document.getElementById('restore-file-input').value = '';
    document.getElementById('restore-file-input').click();
  });
  document.getElementById('restore-file-input')?.addEventListener('change', e => {
    if (e.target.files[0]) importProgress(e.target.files[0]);
  });

  // GOC-045: Status filter
  document.getElementById('status-filter')?.addEventListener('click', e => {
    const btn = e.target.closest('.status-btn');
    if (!btn) return;
    document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentStatus = btn.dataset.status;
    renderSidebar(currentFilter, currentTag, currentCurriculum);
  });

  // GOC-046: Font size control
  const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20];
  let fontSizeIdx = FONT_SIZES.indexOf(parseInt(localStorage.getItem('goc_fontSize') || '14')) || 2;
  if (fontSizeIdx < 0) fontSizeIdx = 2;
  function applyFontSize() {
    const sz = FONT_SIZES[fontSizeIdx] + 'px';
    const ta = document.getElementById('code-editor');
    const hl = document.getElementById('highlight-layer');
    const ln = document.getElementById('line-numbers');
    if (ta) ta.style.fontSize = sz;
    if (hl) hl.style.fontSize = sz;
    if (ln) ln.style.fontSize = sz;
    const lbl = document.getElementById('font-size-label');
    if (lbl) lbl.textContent = FONT_SIZES[fontSizeIdx] + 'px';
    document.getElementById('btn-font-dec').disabled = fontSizeIdx === 0;
    document.getElementById('btn-font-inc').disabled = fontSizeIdx === FONT_SIZES.length - 1;
    localStorage.setItem('goc_fontSize', FONT_SIZES[fontSizeIdx]);
    updateHighlight();
  }
  document.getElementById('btn-font-dec')?.addEventListener('click', () => {
    if (fontSizeIdx > 0) { fontSizeIdx--; applyFontSize(); }
  });
  document.getElementById('btn-font-inc')?.addEventListener('click', () => {
    if (fontSizeIdx < FONT_SIZES.length - 1) { fontSizeIdx++; applyFontSize(); }
  });
  applyFontSize();

  // GOC-095: Font family selector
  (function initFontFamily() {
    const sel = document.getElementById('font-family-select');
    if (!sel) return;
    const saved = localStorage.getItem('goc_fontFamily');
    if (saved) { sel.value = saved; applyFontFamilyValue(saved); }
    sel.addEventListener('change', () => {
      applyFontFamilyValue(sel.value);
      localStorage.setItem('goc_fontFamily', sel.value);
    });
    function applyFontFamilyValue(val) {
      const ta = document.getElementById('code-editor');
      const hl = document.getElementById('highlight-layer');
      const ln = document.getElementById('line-numbers');
      if (ta) ta.style.fontFamily = val;
      if (hl) hl.style.fontFamily = val;
      if (ln) ln.style.fontFamily = val;
    }
  })();

  // GOC-039: Search input
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const _raw = searchInput.value.trim();
      // GOC-154: #number jump
      const _jumpMatch = _raw.match(/^#(\d+)$/);
      if (_jumpMatch) {
        const _target = problems.find(p => String(p.id) === _jumpMatch[1]);
        if (_target) {
          loadProblem(_target);
          searchInput.value = '';
          currentSearch = '';
          if (searchClearBtn) searchClearBtn.classList.remove('visible');
          renderSidebar(currentFilter, currentTag, currentCurriculum);
        }
        return;
      }
      currentSearch = _raw;
      // GOC-101: show/hide clear button
      if (searchClearBtn) searchClearBtn.classList.toggle('visible', currentSearch.length > 0);
      renderSidebar(currentFilter, currentTag, currentCurriculum);
    });
  }
  // GOC-101: clear search button
  searchClearBtn?.addEventListener('click', () => {
    if (searchInput) { searchInput.value = ''; searchInput.focus(); }
    currentSearch = '';
    searchClearBtn.classList.remove('visible');
    renderSidebar(currentFilter, currentTag, currentCurriculum);
  });

  // GOC-040: Keyboard shortcuts — Ctrl+Enter = Run, Ctrl+Shift+Enter = Submit
  document.addEventListener('keydown', e => {
    if (!e.ctrlKey && !e.metaKey) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        document.getElementById('btn-submit')?.click();
      } else {
        document.getElementById('btn-run')?.click();
      }
    }
    // GOC-166: Ctrl+F open editor search
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      openEditorSearch();
    }
  });

  // GOC-166: in-editor search
  (function initEditorSearch() {
    let _esMatches = [], _esIdx = -1;

    function _esSearch() {
      const ta = document.getElementById('code-editor');
      const input = document.getElementById('editor-search-input');
      const countEl = document.getElementById('editor-search-count');
      const bar = document.getElementById('editor-search-bar');
      if (!ta || !input || !bar) return;
      const q = input.value;
      _esMatches = [];
      if (q) {
        const text = ta.value.toLowerCase(), ql = q.toLowerCase();
        let pos = 0;
        while ((pos = text.indexOf(ql, pos)) !== -1) { _esMatches.push({ start: pos, end: pos + ql.length }); pos += ql.length; }
      }
      _esIdx = _esMatches.length > 0 ? 0 : -1;
      if (countEl) countEl.textContent = _esMatches.length > 0 ? `1/${_esMatches.length}` : (q ? '无匹配' : '');
      bar.classList.toggle('no-match', !!q && _esMatches.length === 0);
      _esApply(ta);
    }

    function _esApply(ta) {
      if (!ta) ta = document.getElementById('code-editor');
      const countEl = document.getElementById('editor-search-count');
      if (_esIdx >= 0 && _esIdx < _esMatches.length) {
        const m = _esMatches[_esIdx];
        ta.focus();
        ta.setSelectionRange(m.start, m.end);
        const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 20;
        const lineNum = ta.value.substring(0, m.start).split('\n').length;
        ta.scrollTop = Math.max(0, (lineNum - 4) * lineH);
        if (countEl) countEl.textContent = `${_esIdx + 1}/${_esMatches.length}`;
      }
    }

    function _esNext() { if (!_esMatches.length) return; _esIdx = (_esIdx + 1) % _esMatches.length; _esApply(); }
    function _esPrev() { if (!_esMatches.length) return; _esIdx = (_esIdx - 1 + _esMatches.length) % _esMatches.length; _esApply(); }

    window.openEditorSearch = function() {
      const bar = document.getElementById('editor-search-bar');
      const input = document.getElementById('editor-search-input');
      if (!bar || !input) return;
      bar.classList.remove('hidden');
      input.select(); input.focus();
      _esSearch();
    };

    window.closeEditorSearch = function() {
      const bar = document.getElementById('editor-search-bar');
      if (!bar) return;
      bar.classList.add('hidden');
      _esMatches = []; _esIdx = -1;
      document.getElementById('code-editor')?.focus();
    };

    document.getElementById('editor-search-input')?.addEventListener('input', _esSearch);
    document.getElementById('editor-search-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? _esPrev() : _esNext(); }
      if (e.key === 'Escape') { e.preventDefault(); closeEditorSearch(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); _esNext(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); _esPrev(); }
    });
    document.getElementById('editor-search-next')?.addEventListener('click', _esNext);
    document.getElementById('editor-search-prev')?.addEventListener('click', _esPrev);
    document.getElementById('editor-search-close')?.addEventListener('click', closeEditorSearch);
  })();

  // GOC-105: Copy problem description
  document.addEventListener('click', e => {
    if (e.target.id === 'btn-copy-desc' && currentProblem) {
      const text = `#${currentProblem.id} ${currentProblem.title}\n\n${currentProblem.description || ''}`;
      const btn = e.target;
      const copy = () => { btn.textContent = '✅'; setTimeout(() => { btn.textContent = '📋'; }, 1500); };
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(copy).catch(() => {});
    }
  });

  // GOC-106: Sidebar collapse toggle
  (function initSidebarCollapse() {
    const sidebar = document.getElementById('sidebar');
    const btn = document.getElementById('sidebar-collapse-btn');
    if (!sidebar || !btn) return;
    const collapsed = localStorage.getItem('goc_sidebar_collapsed') === '1';
    if (collapsed) { sidebar.classList.add('collapsed'); btn.textContent = '›'; btn.title = '展开侧边栏'; }
    btn.addEventListener('click', () => {
      const isNow = sidebar.classList.toggle('collapsed');
      btn.textContent = isNow ? '›' : '‹';
      btn.title = isNow ? '展开侧边栏' : '折叠侧边栏';
      localStorage.setItem('goc_sidebar_collapsed', isNow ? '1' : '0');
    });
  })();

  // GOC-156: Ctrl+B toggle sidebar (when focus not in editor/input)
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      document.getElementById('sidebar-collapse-btn')?.click();
    }
  });

  // GOC-162: right-click context menu on problem list items
  (function initCtxMenu() {
    const menu = document.getElementById('ctx-menu');
    if (!menu) return;
    let _ctxProblem = null;

    function closeCtxMenu() { menu.classList.add('hidden'); menu.innerHTML = ''; _ctxProblem = null; }

    function openCtxMenu(x, y, p) {
      _ctxProblem = p;
      const starred = isStar(p.id);
      const rec = loadRecord(p.id);
      const hasProgress = !!(rec);
      menu.innerHTML =
        `<button class="ctx-menu-item" id="_ctx-star">${starred ? '☆ 取消收藏' : '★ 收藏题目'}</button>` +
        `<button class="ctx-menu-item" id="_ctx-copy">📋 复制题号 #${p.id}</button>` +
        (hasProgress ? `<div class="ctx-menu-sep"></div><button class="ctx-menu-item danger" id="_ctx-reset">↺ 重置本题进度</button>` : '');
      // Position
      menu.classList.remove('hidden');
      const mw = menu.offsetWidth, mh = menu.offsetHeight;
      const vw = window.innerWidth, vh = window.innerHeight;
      menu.style.left = (x + mw > vw ? vw - mw - 4 : x) + 'px';
      menu.style.top  = (y + mh > vh ? vh - mh - 4 : y) + 'px';

      menu.querySelector('#_ctx-star')?.addEventListener('click', () => {
        toggleStar(p.id);
        if (currentStatus === 'star') renderSidebar(currentFilter, currentTag, currentCurriculum);
        else renderSidebar(currentFilter, currentTag, currentCurriculum);
        closeCtxMenu();
      });
      menu.querySelector('#_ctx-copy')?.addEventListener('click', () => {
        navigator.clipboard?.writeText('#' + p.id).catch(() => {});
        closeCtxMenu();
      });
      menu.querySelector('#_ctx-reset')?.addEventListener('click', () => {
        if (!confirm(`重置题目 #${p.id} 的全部进度？此操作不可撤销。`)) return;
        localStorage.removeItem('goc_' + p.id);
        localStorage.removeItem('goc_time_' + p.id);
        renderSidebar(currentFilter, currentTag, currentCurriculum);
        updateProgress();
        if (currentProblem?.id === p.id) loadProblem(p);
        closeCtxMenu();
      });
    }

    document.getElementById('problem-list')?.addEventListener('contextmenu', e => {
      const item = e.target.closest('[data-id]');
      if (!item) return;
      e.preventDefault();
      const p = problems.find(x => String(x.id) === item.dataset.id);
      if (p) openCtxMenu(e.clientX, e.clientY, p);
    });

    document.addEventListener('click', e => { if (!menu.contains(e.target)) closeCtxMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCtxMenu(); });
  })();

  // GOC-100: Arrow keys navigate problem list (when focus is NOT in editor)
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    if (!currentProblem || !problems.length) return;
    e.preventDefault();
    const idx = problems.indexOf(currentProblem);
    if (e.key === 'ArrowUp' && idx > 0) loadProblem(problems[idx - 1]);
    if (e.key === 'ArrowDown' && idx < problems.length - 1) loadProblem(problems[idx + 1]);
  });

  // GOC-055: Canvas resize handle
  const canvasResizer = document.getElementById('canvas-resizer');
  const canvasSection = document.getElementById('canvas-section');
  if (canvasResizer && canvasSection) {
    let _cDrag = false, _cStartY = 0, _cStartH = 0;
    canvasResizer.addEventListener('mousedown', e => {
      _cDrag = true; _cStartY = e.clientY; _cStartH = canvasSection.offsetHeight;
      canvasResizer.classList.add('dragging');
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!_cDrag) return;
      const newH = Math.max(120, Math.min(500, _cStartH - (e.clientY - _cStartY)));
      canvasSection.style.height = newH + 'px';
      // GOC-069: update canvas size label
      const canvas = document.getElementById('goc-canvas');
      const sizeLabel = document.getElementById('canvas-size-label');
      if (canvas && sizeLabel) sizeLabel.textContent = canvas.width + '×' + canvas.height;
    });
    document.addEventListener('mouseup', () => {
      if (_cDrag) { _cDrag = false; canvasResizer.classList.remove('dragging'); document.body.style.userSelect = ''; }
    });
  }

  // GOC-078: Canvas coordinate tooltip
  (function initCanvasCoord() {
    const canvas = document.getElementById('goc-canvas');
    const coord = document.getElementById('canvas-coord');
    if (!canvas || !coord) return;
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.round((e.clientX - rect.left) * scaleX);
      const y = Math.round((e.clientY - rect.top) * scaleY);
      coord.textContent = x + ', ' + y;
      coord.style.display = 'block';
      coord.style.left = (e.clientX - rect.left + 10) + 'px';
      coord.style.top = (e.clientY - rect.top - 20) + 'px';
    });
    canvas.addEventListener('mouseleave', () => { coord.style.display = 'none'; });
  })();

  // GOC-057: Shortcut help popup
  const btnShortcut = document.getElementById('btn-shortcut');
  const shortcutPopup = document.getElementById('shortcut-popup');
  if (btnShortcut && shortcutPopup) {
    btnShortcut.addEventListener('click', e => {
      e.stopPropagation();
      const rect = btnShortcut.getBoundingClientRect();
      shortcutPopup.style.top = (rect.bottom + 6) + 'px';
      shortcutPopup.style.right = (window.innerWidth - rect.right) + 'px';
      shortcutPopup.classList.toggle('visible');
    });
    document.addEventListener('click', () => shortcutPopup.classList.remove('visible'));
  }

  // GOC-038: Difficulty filter bar
  document.getElementById('filter-bar').addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderSidebar(currentFilter, currentTag, currentCurriculum);
  });

  // Autocomplete global dismiss
  document.addEventListener('click', e => {
    if (!e.target.closest('#autocomplete') && !e.target.closest('#code-editor')) hideAutocomplete();
  });
}

document.addEventListener('DOMContentLoaded', init);
