# Claude Code 任务说明：GOC-175 颜色选择浮窗（pen.c() 即时色板）

**目标**：编辑器中输入 `pen.c(` 或链式调用中的 `.c(` 时，自动弹出 16 色色板浮窗；点击色块即将对应数字（0-15）插入到括号内并关闭浮窗。帮助孩子直观选色，无需记忆数字-颜色对应关系。

- 只改 `oj/index.html`
- 基于现有 `GOCRenderer.GOC_COLORS`（0-15 对应 16 种颜色）
- 不干扰现有 autocomplete；失去焦点/按 Escape/输入 `)` 时关闭

---

## 一、CSS（`.autocomplete` 样式之后插入）

```css
/* GOC-175: color picker popup */
.color-picker-popup { position:fixed; background:#fff; border:1px solid #ddd; border-radius:6px; padding:6px; z-index:5002; display:none; flex-wrap:wrap; gap:3px; width:172px; box-shadow:0 4px 16px rgba(0,0,0,.18); }
.color-picker-popup.visible { display:flex; }
.cp-swatch { width:30px; height:22px; border-radius:3px; cursor:pointer; border:2px solid rgba(0,0,0,.12); display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:bold; text-shadow:0 0 2px rgba(0,0,0,.5); transition:transform .1s, border-color .1s; }
.cp-swatch:hover, .cp-swatch.active { border-color:#222; transform:scale(1.15); }
body.dark-mode .color-picker-popup { background:#252526; border-color:#444; }
body.dark-mode .cp-swatch { border-color:rgba(255,255,255,.15); }
body.dark-mode .cp-swatch:hover, body.dark-mode .cp-swatch.active { border-color:#fff; }
```

---

## 二、HTML（`<div class="autocomplete" id="autocomplete">` 之后）

```html
<!-- GOC-175: color picker popup for pen.c() -->
<div class="color-picker-popup" id="color-picker-popup"></div>
```

---

## 三、JS

### 3.1 在 `init()` 中、`// GOC-050` 之前插入（`drawCompare` 块之后）

```javascript
// GOC-175: build color picker swatches once
(function buildColorPicker() {
  const popup = document.getElementById('color-picker-popup');
  if (!popup || popup.children.length > 0) return;
  const lightFor = new Set([5, 13, 14, 15]); // yellow/gold/orange/white → dark text
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
    e.preventDefault(); // keep textarea focus
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

function _hideColorPicker() {
  document.getElementById('color-picker-popup')?.classList.remove('visible');
}
```

### 3.2 在 `bindEditorEvents()` 末尾（GOC-173 IIFE 之后，`}` 之前）

```javascript
// GOC-175: color picker trigger
ta.addEventListener('input',  _checkColorCtx);
ta.addEventListener('keyup',  _checkColorCtx);
ta.addEventListener('click',  _checkColorCtx);
ta.addEventListener('blur',   _hideColorPicker);
```

---

## 四、验收自检

- [ ] 输入 `pen.c(` → 弹出 16 色色板（4 行 × 4 列小方块，数字 0-15 标在方块上）
- [ ] 已输入数字时对应方块高亮（active 边框）
- [ ] 点击色块 → 数字插入括号内，浮窗关闭，焦点回到编辑器
- [ ] 按 `)` 或 Escape → 浮窗关闭
- [ ] 切换行/光标移走 → 浮窗自动消失
- [ ] 编辑器失焦 → 浮窗关闭
- [ ] 深色模式下浮窗背景/边框正确
- [ ] 不影响现有 autocomplete 行为
