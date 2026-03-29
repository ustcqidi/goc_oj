'use strict';

// ── GOC-149: star helpers ──────────────────────────────────────────
function isStar(id) { return !!localStorage.getItem('goc_star_' + id); }
function toggleStar(id) {
  if (isStar(id)) localStorage.removeItem('goc_star_' + id);
  else localStorage.setItem('goc_star_' + id, '1');
}

// ── Note helpers ───────────────────────────────────────────────────
function loadNote(id) { return localStorage.getItem('goc_note_' + id) || ''; }
function saveNote(id, text) {
  if (text) localStorage.setItem('goc_note_' + id, text);
  else localStorage.removeItem('goc_note_' + id);
}

// ── GOC-153: best time helpers ────────────────────────────────────
function loadBestTime(id) { const v = localStorage.getItem('goc_time_' + id); return v ? parseInt(v, 10) : null; }
function saveBestTime(id, sec) {
  const existing = loadBestTime(id);
  if (existing === null || sec < existing) localStorage.setItem('goc_time_' + id, sec);
}
function formatTimeSec(sec) { return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }

// ── Record helpers ─────────────────────────────────────────────────
function loadRecord(id) {
  try { return JSON.parse(localStorage.getItem('goc_' + id) || 'null'); } catch { return null; }
}
function saveRecord(id, code, status) {
  const prev = loadRecord(id);
  try { localStorage.setItem('goc_' + id, JSON.stringify({ code, status, ts: Date.now() })); } catch {}
  if (typeof renderSidebar === 'function' && document.getElementById('problem-list') && prev?.status !== status) {
    renderSidebar(currentFilter, currentTag, currentCurriculum);
    return;
  }
  if (typeof updateProgress === 'function') updateProgress();
}
