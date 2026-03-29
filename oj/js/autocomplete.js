'use strict';

// ── GOC-015: Autocomplete ─────────────────────────────────────────
let acSelectedIdx = 0;
let acFilteredItems = [];

function showAutocomplete(ta, prefix) {
  acFilteredItems = prefix
    ? AC_ITEMS.filter(it => it.insert.startsWith(prefix) || it.code.startsWith(prefix))
    : AC_ITEMS;
  if (acFilteredItems.length === 0) { hideAutocomplete(); return; }

  const dropdown = document.getElementById('autocomplete');
  dropdown.innerHTML = '';
  acSelectedIdx = 0;
  acFilteredItems.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'ac-item' + (idx === 0 ? ' selected' : '');
    el.innerHTML = `<span class="ac-code">pen.${escapeHtml(item.code)}</span><span class="ac-desc">${escapeHtml(item.desc)}</span>`;
    el.addEventListener('mousedown', e => {
      e.preventDefault();
      insertAcItem(ta, item);
      hideAutocomplete();
    });
    dropdown.appendChild(el);
  });

  const rect = ta.getBoundingClientRect();
  const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 20;
  const lineNum = ta.value.substring(0, ta.selectionStart).split('\n').length;
  const approxTop = rect.top + (lineNum * lineH) - ta.scrollTop;
  dropdown.style.left = (rect.left + 60) + 'px';
  dropdown.style.top = Math.min(approxTop + 2, rect.bottom - 10) + 'px';
  dropdown.classList.add('visible');
}

function hideAutocomplete() {
  document.getElementById('autocomplete').classList.remove('visible');
}

function insertAcItem(ta, item) {
  const val = ta.value;
  const pos = ta.selectionStart;
  const before = val.slice(0, pos);
  const dotPos = before.lastIndexOf('pen.');
  if (dotPos < 0) return;
  ta.value = val.slice(0, dotPos + 4) + item.insert + val.slice(pos);
  const newPos = dotPos + 4 + item.insert.length;
  ta.selectionStart = ta.selectionEnd = newPos;
  ta.focus();
  updateHighlight();
  checkIOPanel();
}

function moveAcSelection(dir) {
  const items = document.getElementById('autocomplete').querySelectorAll('.ac-item');
  items[acSelectedIdx]?.classList.remove('selected');
  acSelectedIdx = (acSelectedIdx + dir + acFilteredItems.length) % acFilteredItems.length;
  items[acSelectedIdx]?.classList.add('selected');
  items[acSelectedIdx]?.scrollIntoView({ block:'nearest' });
}
