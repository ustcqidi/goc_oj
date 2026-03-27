# Claude Code 任务说明：GOC-166 编辑器内文字搜索（Ctrl+F）

**目标**：在代码编辑器内提供轻量「查找」能力——按 `Ctrl+F`（或 `Cmd+F`）弹出搜索栏，高亮当前匹配（`setSelectionRange`），`Enter`/`↓` 跳下一个，`Shift+Enter`/`↑` 跳上一个，`Escape` 关闭。

- 只改 `oj/index.html`
- 不做「替换」功能（MVP 只做查找）
- 搜索大小写不敏感（`toLowerCase`）

---

## 一、HTML

在 `#editor-wrap`（或编辑器外层）末尾、`</div>` 前追加搜索栏（相对编辑器定位）：

```html
<!-- GOC-166: in-editor search bar -->
<div class="editor-search-bar hidden" id="editor-search-bar">
  <input class="editor-search-input" id="editor-search-input" placeholder="搜索代码…" autocomplete="off" spellcheck="false">
  <span class="editor-search-count" id="editor-search-count"></span>
  <button class="editor-search-nav" id="editor-search-prev" title="上一个（Shift+Enter）">↑</button>
  <button class="editor-search-nav" id="editor-search-next" title="下一个（Enter）">↓</button>
  <button class="editor-search-close" id="editor-search-close" title="关闭（Escape）">✕</button>
</div>
```

放置位置：编辑器容器内（`#editor-wrap` 下），absolute 定位浮在右上角。

---

## 二、CSS（编辑器工具栏 CSS 附近）

```css
/* GOC-166: in-editor search bar */
.editor-search-bar { position: absolute; top: 4px; right: 4px; z-index: 20; display: flex; align-items: center; gap: 4px; background: #fff; border: 1px solid #c5cae9; border-radius: 6px; padding: 3px 6px; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
.editor-search-bar.hidden { display: none; }
.editor-search-input { border: none; outline: none; font-size: 12px; width: 160px; background: transparent; color: #333; }
.editor-search-count { font-size: 11px; color: #999; min-width: 32px; text-align: center; }
.editor-search-nav { border: none; background: none; cursor: pointer; font-size: 13px; padding: 0 3px; color: #555; line-height: 1; }
.editor-search-nav:hover { color: var(--goc-accent); }
.editor-search-close { border: none; background: none; cursor: pointer; font-size: 12px; padding: 0 2px; color: #aaa; }
.editor-search-close:hover { color: #e53935; }
.editor-search-bar.no-match { border-color: #ef9a9a; }
.editor-search-bar.no-match .editor-search-input { color: #c62828; }
body.dark-mode .editor-search-bar { background: #2a2c2e; border-color: #5c6bc0; box-shadow: 0 2px 8px rgba(0,0,0,.4); }
body.dark-mode .editor-search-input { color: #ddd; }
body.dark-mode .editor-search-nav { color: #aaa; }
body.dark-mode .editor-search-close { color: #666; }
```

`#editor-wrap` 需要 `position: relative`（已有则跳过）。

---

## 三、JS

### 3.1 状态变量（bindEditorEvents 附近）

```javascript
// GOC-166: in-editor search state
let _esMatches = [];   // array of {start, end}
let _esIdx = -1;       // current match index
```

### 3.2 核心函数

```javascript
// GOC-166: editor search helpers
function _esSearch() {
  const ta = document.getElementById('code-editor');
  const input = document.getElementById('editor-search-input');
  const countEl = document.getElementById('editor-search-count');
  const bar = document.getElementById('editor-search-bar');
  if (!ta || !input || !bar) return;
  const q = input.value;
  _esMatches = [];
  if (q) {
    const text = ta.value.toLowerCase();
    const ql = q.toLowerCase();
    let pos = 0;
    while ((pos = text.indexOf(ql, pos)) !== -1) {
      _esMatches.push({ start: pos, end: pos + ql.length });
      pos += ql.length;
    }
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
    // Scroll match into view
    const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 20;
    const lineNum = ta.value.substring(0, m.start).split('\n').length;
    ta.scrollTop = Math.max(0, (lineNum - 4) * lineH);
    if (countEl) countEl.textContent = `${_esIdx + 1}/${_esMatches.length}`;
  }
}

function _esNext() { if (_esMatches.length === 0) return; _esIdx = (_esIdx + 1) % _esMatches.length; _esApply(); }
function _esPrev() { if (_esMatches.length === 0) return; _esIdx = (_esIdx - 1 + _esMatches.length) % _esMatches.length; _esApply(); }

function openEditorSearch() {
  const bar = document.getElementById('editor-search-bar');
  const input = document.getElementById('editor-search-input');
  if (!bar || !input) return;
  bar.classList.remove('hidden');
  input.select();
  input.focus();
  _esSearch();
}

function closeEditorSearch() {
  const bar = document.getElementById('editor-search-bar');
  if (!bar) return;
  bar.classList.add('hidden');
  _esMatches = []; _esIdx = -1;
  document.getElementById('code-editor')?.focus();
}
```

### 3.3 事件绑定（在 bindEditorEvents 内 或 init 时）

```javascript
// GOC-166: search bar events
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
```

### 3.4 全局快捷键（Ctrl+F）

在 GOC-040 keydown handler 附近（或独立的全局 keydown）：

```javascript
// GOC-166: Ctrl+F opens editor search
// (inside the Ctrl/Meta keydown handler)
if (e.key === 'f' || e.key === 'F') {
  // only when editor has focus or shortcut pressed anywhere outside input
  e.preventDefault();
  openEditorSearch();
  return;
}
```

注意：浏览器默认 Ctrl+F 打开浏览器搜索栏，需 `e.preventDefault()`；仅当焦点在 editor 内才可靠拦截浏览器 Ctrl+F，焦点在其他地方时浏览器可能先处理。

**实用方案**：在 `code-editor` 的 `keydown` 监听内拦截（焦点在编辑器时 100% 生效）+ 全局 keydown 也追加（尽力拦截）。

---

## 四、验收自检

- [ ] `Ctrl+F`（焦点在编辑器时）打开搜索栏，输入框自动聚焦
- [ ] 输入关键字实时高亮第一个匹配（蓝色选中），显示 `1/N`
- [ ] `Enter` / `↓` 按钮 跳到下一个，`Shift+Enter` / `↑` 跳到上一个，循环
- [ ] 无匹配时输入框变红，显示「无匹配」
- [ ] `Escape` 关闭搜索栏，焦点回到编辑器
- [ ] ✕ 按钮关闭搜索栏
- [ ] 深色模式下搜索栏样式正常
- [ ] 搜索不影响编辑器正常编辑
