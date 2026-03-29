'use strict';

// ── GOC-014: Syntax highlighting ──────────────────────────────────
function highlightCode(text) {
  const tokens = [];
  let i = 0, n = text.length;

  while (i < n) {
    if (text[i] === '/' && text[i+1] === '/') {
      let end = text.indexOf('\n', i); if (end < 0) end = n;
      tokens.push({ type:'comment', text:text.slice(i, end) }); i = end; continue;
    }
    if (text[i] === '/' && text[i+1] === '*') {
      let end = text.indexOf('*/', i+2); if (end < 0) end = n - 2;
      tokens.push({ type:'comment', text:text.slice(i, end+2) }); i = end+2; continue;
    }
    if (text[i] === '"' || text[i] === "'") {
      const q = text[i]; let j = i+1;
      while (j < n && text[j] !== q && text[j] !== '\n') { if (text[j] === '\\') j++; j++; }
      if (j < n && text[j] === q) j++;
      tokens.push({ type:'string', text:text.slice(i, j) }); i = j; continue;
    }
    if (/\d/.test(text[i])) {
      let j = i; while (j < n && /[\d.]/.test(text[j])) j++;
      tokens.push({ type:'number', text:text.slice(i, j) }); i = j; continue;
    }
    if (/[a-zA-Z_]/.test(text[i])) {
      let j = i; while (j < n && /[a-zA-Z0-9_]/.test(text[j])) j++;
      const word = text.slice(i, j);
      let type = 'plain';
      if (word === 'pen')              type = 'pen';
      else if (HL_KEYWORDS.has(word))  type = 'keyword';
      else if (HL_TYPES.has(word))     type = 'type';
      else if (HL_IO.has(word))        type = 'io';
      else if (tokens.length > 0 && tokens[tokens.length-1].type === 'dot' && HL_PEN_METHODS.has(word)) type = 'method';
      tokens.push({ type, text:word }); i = j; continue;
    }
    if (text[i] === '.') { tokens.push({ type:'dot', text:'.' }); i++; continue; }
    tokens.push({ type:'plain', text:text[i] }); i++;
  }

  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return tokens.map(t => {
    const e = esc(t.text);
    switch (t.type) {
      case 'comment': return `<span class="hl-comment">${e}</span>`;
      case 'string':  return `<span class="hl-string">${e}</span>`;
      case 'number':  return `<span class="hl-number">${e}</span>`;
      case 'keyword': return `<span class="hl-keyword">${e}</span>`;
      case 'type':    return `<span class="hl-type">${e}</span>`;
      case 'pen':     return `<span class="hl-pen">${e}</span>`;
      case 'method':  return `<span class="hl-method">${e}</span>`;
      case 'io':      return `<span class="hl-io">${e}</span>`;
      default:        return `<span class="hl-plain">${e}</span>`;
    }
  }).join('') + '\n';
}

function updateHighlight() {
  const ta = document.getElementById('code-editor');
  const hl = document.getElementById('highlight-layer');
  if (!ta || !hl) return;
  hl.innerHTML = highlightCode(ta.value);
  hl.scrollTop = ta.scrollTop;
  hl.scrollLeft = ta.scrollLeft;
  updateLineNumbers();
  // GOC-081: update line count label
  const lineCount = document.getElementById('editor-line-count');
  if (lineCount) { const n = ta.value.split('\n').length; lineCount.textContent = n + ' 行 / ' + ta.value.length + ' 字符'; } // GOC-163
}

// GOC-036: line number updater (GOC-164: enhanced with breakpoint/current-line markers)
function updateLineNumbers() {
  const ta = document.getElementById('code-editor');
  const ln = document.getElementById('line-numbers');
  if (!ta || !ln) return;
  const count = ta.value.split('\n').length;
  ln.innerHTML = Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const isBp = breakpoints.has(n);
    const isCur = currentStepLineNum === n;
    const cls = (isBp ? 'ln-bp' : '') + (isCur ? (isBp ? ' ln-cur' : 'ln-cur') : '');
    return `<span data-line="${n}"${cls ? ` class="${cls}"` : ''}>${isBp ? '●' : n}</span>`;
  }).join('\n');
  ln.scrollTop = ta.scrollTop;
}
