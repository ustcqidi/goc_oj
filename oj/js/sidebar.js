'use strict';

// ── GOC-022: Curriculum filter ────────────────────────────────────
function initCurriculumFilter() {
  const container = document.getElementById('curriculum-filter');
  container.innerHTML = '<span class="curriculum-label">数学章节：</span>';

  const allChip = document.createElement('span');
  allChip.className = 'curr-chip active';
  allChip.textContent = '全部';
  allChip.dataset.curr = 'all';
  container.appendChild(allChip);

  Object.keys(CURRICULUM_MAP).forEach(topic => {
    const chip = document.createElement('span');
    chip.className = 'curr-chip';
    chip.textContent = topic;
    chip.dataset.curr = topic;
    container.appendChild(chip);
  });

  container.addEventListener('click', e => {
    const chip = e.target.closest('.curr-chip');
    if (!chip) return;
    container.querySelectorAll('.curr-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentCurriculum = chip.dataset.curr;
    renderSidebar(currentFilter, currentTag, currentCurriculum);
  });
}

// ── Tag filter ────────────────────────────────────────────────────
function initTagFilter() {
  const tagSet = new Set();
  const problems = window.PROBLEMS_DATA || [];
  problems.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
  const container = document.getElementById('tag-filter');
  container.innerHTML = '';

  const allChip = document.createElement('span');
  allChip.className = 'tag-chip active';
  allChip.textContent = '全部标签';
  allChip.dataset.tag = 'all';
  container.appendChild(allChip);

  Array.from(tagSet).sort().forEach(t => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.textContent = t;
    chip.dataset.tag = t;
    container.appendChild(chip);
  });

  container.addEventListener('click', e => {
    const chip = e.target.closest('.tag-chip');
    if (!chip) return;
    container.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentTag = chip.dataset.tag;
    renderSidebar(currentFilter, currentTag, currentCurriculum);
  });
}

// ── GOC-041: Progress stats ────────────────────────────────────────
function updateProgress() {
  const problems = window.PROBLEMS_DATA || [];
  const total = problems.length;
  let passed = 0;
  for (const p of problems) {
    const rec = loadRecord(p.id);
    if (rec && rec.status === 'pass') passed++;
  }
  const pct = total ? Math.round(passed / total * 100) : 0;
  const label = document.getElementById('progress-label');
  const fill = document.getElementById('progress-fill');
  if (label) label.textContent = passed + ' / ' + total + ' (' + pct + '%)';
  if (fill) fill.style.width = pct + '%';
  // GOC-053: sync header stats
  const hSolved = document.getElementById('header-solved');
  const hTotal = document.getElementById('header-total');
  if (hSolved) hSolved.textContent = passed;
  if (hTotal) hTotal.textContent = total;
  // GOC-061: sync welcome screen stats
  const wsTotal = document.getElementById('ws-total');
  const wsSolved = document.getElementById('ws-solved');
  const wsPct = document.getElementById('ws-pct');
  if (wsTotal) wsTotal.textContent = total;
  if (wsSolved) wsSolved.textContent = passed;
  if (wsPct) wsPct.textContent = pct + '%';
  // GOC-108: update progress ring
  const ringFill = document.getElementById('progress-ring-fill');
  const ringPct = document.getElementById('progress-ring-pct');
  if (ringFill) { const r = 16; const circ = 2 * Math.PI * r; ringFill.style.strokeDasharray = circ.toFixed(1); ringFill.style.strokeDashoffset = (circ * (1 - pct / 100)).toFixed(1); }
  if (ringPct) ringPct.textContent = pct + '%';
  // GOC-161: difficulty breakdown tooltip on progress ring
  const _dc = { easy:0, medium:0, hard:0 }, _dp = { easy:0, medium:0, hard:0 };
  problems.forEach(p => {
    if (_dc[p.difficulty] !== undefined) {
      _dc[p.difficulty]++;
      const r = loadRecord(p.id);
      if (r && r.status === 'pass') _dp[p.difficulty]++;
    }
  });
  const _ringWrap = document.getElementById('progress-ring-wrap');
  if (_ringWrap) _ringWrap.title = `⭐ 入门 ${_dp.easy}/${_dc.easy}　🔥 进阶 ${_dp.medium}/${_dc.medium}　💎 高级 ${_dp.hard}/${_dc.hard}`;
  // GOC-167: today's stats bubble
  const _todayEl = document.getElementById('today-stats');
  if (_todayEl) {
    const _todayStart = new Date(); _todayStart.setHours(0,0,0,0);
    let _todayPass = 0;
    for (const _p of problems) { const _r = loadRecord(_p.id); if (_r?.status === 'pass' && _r.ts >= _todayStart.getTime()) _todayPass++; }
    _todayEl.textContent = _todayPass > 0 ? `今日 +${_todayPass} 题` : '';
  }
  // GOC-089: refresh diff filter pass counts
  if (typeof updateDiffCounts === 'function') updateDiffCounts();
  // GOC-094: status filter counts
  if (typeof updateStatusCounts === 'function') updateStatusCounts();
}

// ── Sidebar rendering ──────────────────────────────────────────────
function renderSidebar(filter, tag, curriculum) {
  const problems = window.PROBLEMS_DATA || [];
  const list = document.getElementById('problem-list');
  list.innerHTML = '';
  let filtered = problems.filter(p => filter === 'all' || p.difficulty === filter);
  if (tag && tag !== 'all') {
    filtered = filtered.filter(p => (p.tags || []).includes(tag));
  }
  if (curriculum && curriculum !== 'all') {
    const ids = CURRICULUM_MAP[curriculum] || [];
    filtered = filtered.filter(p => ids.includes(p.id));
  }
  // GOC-045: status filter; GOC-149: star filter
  if (currentStatus !== 'all') {
    filtered = filtered.filter(p => {
      const r = loadRecord(p.id);
      if (currentStatus === 'todo') return !r;
      if (currentStatus === 'pass') return r && r.status === 'pass';
      if (currentStatus === 'fail') return r && r.status !== 'pass';
      if (currentStatus === 'star') return isStar(p.id);
      return true;
    });
  }
  // GOC-155: sort fail filter by most-recently-attempted first
  if (currentStatus === 'fail') {
    filtered = filtered.slice().sort((a, b) => {
      const ta = loadRecord(a.id)?.ts || 0;
      const tb = loadRecord(b.id)?.ts || 0;
      return tb - ta;
    });
  }
  // GOC-039: keyword search
  if (currentSearch) {
    const kw = currentSearch.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(kw) || p.id.toLowerCase().includes(kw)
    );
  }
  document.getElementById('prob-count').textContent = '(' + filtered.length + '/' + problems.length + ')';
  updateProgress();

  filtered.forEach(p => {
    const rec = loadRecord(p.id);
    const item = document.createElement('div');
    const statusCls = rec ? (rec.status === 'pass' ? ' status-pass' : ' status-fail') : '';
    item.className = 'problem-item' + (currentProblem && currentProblem.id === p.id ? ' active' : '') + statusCls;
    item.dataset.id = p.id;
    item.title = p.title;

    const dotClass = rec ? (rec.status === 'pass' ? 'pass' : 'fail') : 'todo';
    const tagsHtml = (p.tags || []).slice(0, 3).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');

    // GOC-086: highlight search keyword in title
    const titleDisplay = currentSearch
      ? escapeHtml(p.title).replace(new RegExp('(' + escapeHtml(currentSearch).replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi'), '<mark style="background:#fff176;border-radius:2px;padding:0 1px">$1</mark>')
      : escapeHtml(p.title);
    // GOC-098: emoji status icon
    const statusIcon = dotClass === 'pass' ? '✅' : dotClass === 'fail' ? '🔴' : '';
    // GOC-149: star button
    const starred = isStar(p.id);
    item.innerHTML = `
      <div class="p-num">#${p.id}</div>
      <div class="p-title">${titleDisplay}</div>
      <div class="p-meta">
        <span class="badge ${p.difficulty}">${DIFFICULTY_LABEL[p.difficulty] || p.difficulty}</span>
        ${tagsHtml}
        ${statusIcon ? `<span style="margin-left:auto;font-size:11px" title="${dotClass === 'pass' ? '已通过' : '尝试过'}">${statusIcon}</span>` : '<span class="p-status-dot todo" title="未做"></span>'}
        ${localStorage.getItem('goc_note_' + p.id) ? '<span title="有笔记" style="font-size:11px">📝</span>' : ''}
        ${(() => { const bs = rec && rec.status === 'pass' ? loadBestTime(p.id) : null; return bs !== null ? `<span style="font-size:10px;color:#aaa" title="最佳用时">⏱${formatTimeSec(bs)}</span>` : ''; })()}
        <button class="star-btn${starred ? ' starred' : ''}" data-id="${p.id}" title="${starred ? '取消收藏' : '收藏'}">${starred ? '★' : '☆'}</button>
      </div>`;
    item.addEventListener('click', () => loadProblem(p));
    // GOC-149: star toggle (must not bubble to loadProblem)
    item.querySelector('.star-btn').addEventListener('click', e => {
      e.stopPropagation();
      const id = e.currentTarget.dataset.id;
      toggleStar(id);
      if (currentStatus === 'star') {
        renderSidebar(currentFilter, currentTag, currentCurriculum);
      } else {
        const btn = e.currentTarget;
        btn.classList.toggle('starred', isStar(id));
        btn.textContent = isStar(id) ? '★' : '☆';
        btn.title = isStar(id) ? '取消收藏' : '收藏';
      }
    });
    list.appendChild(item);
  });
  // GOC-059: scroll active item into view
  const activeItem = list.querySelector('.problem-item.active');
  if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  // GOC-073: filter summary
  const summary = document.getElementById('filter-summary');
  if (summary) {
    const parts = [];
    if (filter !== 'all') parts.push(DIFFICULTY_LABEL[filter] || filter);
    if (tag !== 'all') parts.push(tag);
    if (curriculum !== 'all') parts.push(curriculum);
    if (currentStatus !== 'all') parts.push({todo:'未做',pass:'已通过',fail:'未通过',star:'⭐ 收藏'}[currentStatus] || currentStatus);
    if (currentSearch) parts.push('搜索: ' + currentSearch);
    if (parts.length) {
      summary.innerHTML = '筛选：' + parts.map(p => `<span class="fs-tag">${escapeHtml(p)}</span>`).join('') +
        ' <button class="btn-clear-filter" id="btn-clear-filter">✕ 清除</button>';
      document.getElementById('btn-clear-filter')?.addEventListener('click', () => {
        // GOC-077: reset all filters
        currentFilter = 'all'; currentTag = 'all'; currentCurriculum = 'all';
        currentStatus = 'all'; currentSearch = '';
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
        document.querySelectorAll('.status-btn').forEach(b => b.classList.toggle('active', b.dataset.status === 'all'));
        document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.curr-chip').forEach(c => c.classList.remove('active'));
        const si = document.getElementById('search-input'); if (si) si.value = '';
        renderSidebar('all', 'all', 'all');
      });
    } else {
      summary.innerHTML = '';
    }
  }
}

function syncSidebarActiveProblem(problemId) {
  const list = document.getElementById('problem-list');
  if (!list) return false;
  let activeItem = null;
  list.querySelectorAll('.problem-item.active').forEach(el => el.classList.remove('active'));
  if (!problemId) return false;
  activeItem = list.querySelector(`.problem-item[data-id="${CSS.escape(String(problemId))}"]`);
  if (!activeItem) return false;
  activeItem.classList.add('active');
  activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  return true;
}
