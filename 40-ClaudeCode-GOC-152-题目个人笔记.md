# Claude Code 任务说明：GOC-152 题目个人笔记

**目标**：题目面板 prob-desc 下方加可折叠笔记区；textarea 失焦自动保存到 `goc_note_{id}`；有笔记的题目侧栏显示 📝 图标。

---

## 一、硬性要求

- 只改 `oj/index.html`。
- loadNote / saveNote 读写 localStorage；与 GOC-151 备份兼容（`goc_note_*` 不在 PREF_KEYS 中，自动被备份/恢复）。
- 切换题目时若已有笔记自动展开，无笔记默认折叠。

---

## 二、CSS（紧跟 `.hint-box` 样式块后）

```css
/* GOC-152: Personal note */
.note-section { border-top: 1px solid var(--goc-border-light); flex-shrink: 0; }
.note-toggle-btn { width:100%; text-align:left; background:none; border:none; cursor:pointer; padding:5px 14px; font-size:11.5px; color:#999; transition:background .15s; }
.note-toggle-btn:hover { background:#f5f5f5; color:#555; }
.note-toggle-btn.has-note { color:#1976d2; font-weight:500; }
.note-content { padding:4px 14px 10px; display:flex; flex-direction:column; gap:4px; }
.note-textarea { width:100%; box-sizing:border-box; resize:vertical; font-size:12px; border:1px solid var(--goc-border); border-radius:4px; padding:5px 8px; font-family:inherit; line-height:1.5; min-height:56px; max-height:140px; }
.note-textarea:focus { outline:none; border-color:var(--goc-primary); box-shadow:0 0 0 2px rgba(26,26,46,.1); }
.note-save-status { font-size:10px; color:#4caf50; min-height:14px; }
body.dark-mode .note-toggle-btn:hover { background:#2a2c2e; }
body.dark-mode .note-textarea { background:#2a2c2e; border-color:#444; color:#ddd; }
```

---

## 三、HTML（template 中，紧跟 `<div class="prob-desc" id="p-desc"></div>` 后）

```html
<div class="note-section" id="note-section">
  <button class="note-toggle-btn" id="note-toggle-btn">✏️ 我的笔记</button>
  <div class="note-content" id="note-content" style="display:none">
    <textarea id="note-textarea" maxlength="200" placeholder="写下解题思路或难点…（最多200字）"></textarea>
    <span class="note-save-status" id="note-save-status"></span>
  </div>
</div>
```

---

## 四、JS

### 4.1 helpers（Storage helpers 附近）

```javascript
function loadNote(id) { return localStorage.getItem('goc_note_' + id) || ''; }
function saveNote(id, text) {
  if (text) localStorage.setItem('goc_note_' + id, text);
  else localStorage.removeItem('goc_note_' + id);
}
```

### 4.2 loadProblem 末尾追加（cancelAnimation 之后）

```javascript
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
```

### 4.3 note toggle（document click 委托，与 prob-desc-toggle 同位置）

```javascript
if (e.target.id === 'note-toggle-btn') {
  const c = document.getElementById('note-content');
  if (!c) return;
  const open = c.style.display === 'none';
  c.style.display = open ? '' : 'none';
  if (open) document.getElementById('note-textarea')?.focus();
}
```

（加在 GOC-092 的 `document.addEventListener('click', ...)` 处理中，与 prob-desc-toggle 并列）

### 4.4 note auto-save（document input 委托，防抖 500ms）

```javascript
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
```

### 4.5 renderSidebar — 📝 图标

在 `item.innerHTML` 的 `p-meta` 内、`.star-btn` 前：

```javascript
const hasNote = !!localStorage.getItem('goc_note_' + p.id);
// p-meta 内加：
${hasNote ? '<span title="有笔记" style="font-size:11px">📝</span>' : ''}
```

---

## 五、验收自检

- [ ] 题目面板 desc 下方有「✏️ 我的笔记」折叠按钮
- [ ] 切换到有笔记的题目时自动展开，无笔记时默认折叠
- [ ] textarea 输入后 500ms 自动保存，显示「已保存 ✓」2秒
- [ ] 有笔记的题目侧栏 p-meta 显示 📝 图标
- [ ] `docs/实现记录.md` 已更新
