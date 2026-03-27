# Claude Code 任务说明：GOC-157 通过后展示参考解法

**目标**：题目面板笔记区下方新增「💡 参考解法」折叠区；只在题目已通过（`rec.status === 'pass'`）且 `p.solution` 存在时显示；展开后显示带语法高亮的只读代码块，防止未通过时抄答案。

---

## 一、硬性要求

- 只改 `oj/index.html`。
- 复用现有 `highlightCode()` 做语法高亮（只读 `<pre>`，非 textarea）。
- 切换题目时：已通过且有 solution → 显示但默认折叠；未通过 / 无 solution → 整块隐藏。
- 提交通过瞬间：立即显示该区块（无需刷新/重新加载题目）。

---

## 二、CSS（紧跟 `.note-section` 样式块后）

```css
/* GOC-157: Solution reveal */
.sol-reveal-section { border-top: 1px solid var(--goc-border-light); flex-shrink: 0; }
.sol-reveal-btn { width:100%; text-align:left; background:none; border:none; cursor:pointer; padding:5px 14px; font-size:11.5px; color:#4caf50; font-weight:500; transition:background .15s; }
.sol-reveal-btn:hover { background:#f5f5f5; }
.sol-reveal-content { padding:4px 14px 10px; }
.sol-reveal-pre { background:#f6f8fa; border:1px solid var(--goc-border); border-radius:4px; padding:8px 10px; font-size:11.5px; font-family:'Menlo','Consolas',monospace; overflow-x:auto; line-height:1.5; white-space:pre; margin:0; }
body.dark-mode .sol-reveal-btn:hover { background:#2a2c2e; }
body.dark-mode .sol-reveal-pre { background:#1a1c1e; border-color:#444; }
```

---

## 三、HTML（template 中，紧跟 `note-section` div 后、`prob-resizer` 前）

```html
<div class="sol-reveal-section" id="sol-reveal-section" style="display:none">
  <button class="sol-reveal-btn" id="sol-reveal-btn">💡 参考解法 ▼</button>
  <div class="sol-reveal-content" id="sol-reveal-content" style="display:none"></div>
</div>
```

---

## 四、JS

### 4.1 loadProblem 末尾（GOC-152 笔记初始化块之后）

```javascript
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
```

### 4.2 submitCode — verdict.pass 块内（saveRecord 之后）

```javascript
// GOC-157: reveal section becomes visible on pass
const _sr = document.getElementById('sol-reveal-section');
if (_sr && currentProblem?.solution) {
  _sr.style.display = '';
  const _sc = document.getElementById('sol-reveal-content');
  if (_sc && !_sc.innerHTML) {
    _sc.innerHTML = `<pre class="sol-reveal-pre">${highlightCode(currentProblem.solution)}</pre>`;
  }
}
```

### 4.3 click 委托（与 note-toggle-btn 同位置）

```javascript
if (e.target.id === 'sol-reveal-btn') {
  const c = document.getElementById('sol-reveal-content');
  const btn = e.target;
  if (!c) return;
  const open = c.style.display === 'none';
  c.style.display = open ? '' : 'none';
  btn.textContent = open ? '💡 参考解法 ▲' : '💡 参考解法 ▼';
}
```

---

## 五、验收自检

- [ ] 未通过题目不显示「参考解法」区
- [ ] 已通过题目切换到该题：显示「💡 参考解法 ▼」折叠按钮（默认折叠）
- [ ] 点击展开：显示带语法高亮的参考代码（只读 pre）
- [ ] 本次提交通过瞬间：该区块立即出现（无需切换题目）
- [ ] 暗色模式下样式正确
- [ ] `docs/实现记录.md` 已更新
