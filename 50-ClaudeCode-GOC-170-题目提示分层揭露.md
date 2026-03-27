# Claude Code 任务说明：GOC-170 题目「提示」分层揭露

**目标**：在题目面板新增「提示」区域，支持 `p.hints: string[]` 分层揭露（每次点击「💡 提示」按钮展示下一条），彻底展示后按钮消失；向下兼容现有 `p.hint: string`（编辑器工具栏 btn-hint 行为不变）。

- 只改 `oj/index.html`
- 不改现有 `p.hint` / `btn-hint` / `hint-box` 逻辑
- 提示状态（已揭几条）切题时重置，不持久化

---

## 一、CSS（`.hint-box` 之后插入）

```css
/* GOC-170: layered hints section */
.hint-section { border-top: 1px solid var(--goc-border-light); flex-shrink: 0; padding: 6px 14px 8px; }
.hint-items { display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px; }
.hint-reveal-item { background: #fffde7; border-left: 4px solid #ffd54f; padding: 7px 10px; border-radius: 0 var(--goc-radius) var(--goc-radius) 0; font-size: 12.5px; color: #555; line-height: 1.75; animation: goc-hintin .3s ease; }
.hint-reveal-item strong { color: #f57f17; }
.hint-next-btn { font-size: 11.5px; background: #fff8e1; color: #f57f17; border: 1px solid #ffe082; border-radius: 4px; padding: 3px 10px; cursor: pointer; transition: background .15s; }
.hint-next-btn:hover { background: #fff3cd; }
body.dark-mode .hint-section { border-color: #333; }
body.dark-mode .hint-reveal-item { background: #2a2510; border-color: #c8900a; color: #ccc; }
body.dark-mode .hint-reveal-item strong { color: #ffc107; }
body.dark-mode .hint-next-btn { background: #2a2510; color: #ffc107; border-color: #c8900a; }
body.dark-mode .hint-next-btn:hover { background: #332d10; }
```

---

## 二、HTML（`#tpl-problem-view`，`note-section` 之后、`sol-reveal-section` 之前）

```html
<!-- GOC-170: layered hints section -->
<div class="hint-section" id="hint-section" style="display:none">
  <div class="hint-items" id="hint-items"></div>
  <button class="hint-next-btn" id="hint-next-btn">💡 提示</button>
</div>
```

---

## 三、JS

### 3.1 在 `init()` 顶部声明状态变量（紧跟其他 let 变量之后）

```javascript
let _hintIdx = 0; // GOC-170: layered hint reveal index
```

### 3.2 在 `loadProblem(p)` 中，note 块之后、`// GOC-164` 之前插入

```javascript
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
```

### 3.3 在 `bindEditorEvents()` 中追加

```javascript
// GOC-170: hint next reveal
document.getElementById('hint-next-btn')?.addEventListener('click', () => {
  if (!currentProblem || !Array.isArray(currentProblem.hints)) return;
  if (_hintIdx >= currentProblem.hints.length) return;
  const item = document.createElement('div');
  item.className = 'hint-reveal-item';
  item.innerHTML = `<strong>提示 ${_hintIdx + 1}：</strong>${escapeHtml(currentProblem.hints[_hintIdx])}`;
  document.getElementById('hint-items')?.appendChild(item);
  _hintIdx++;
  if (_hintIdx >= currentProblem.hints.length) {
    document.getElementById('hint-next-btn').style.display = 'none';
  }
});
```

---

## 四、验收自检

- [ ] 无 `p.hints` 的题目：hint-section 不显示，旧 btn-hint 行为不变
- [ ] 有 `p.hints: ['提示1','提示2']` 的题目：hint-section 可见，显示「💡 提示」按钮
- [ ] 第一次点击：出现「提示 1：…」（带入场动画）
- [ ] 第二次点击：出现「提示 2：…」
- [ ] 全部揭示后按钮消失
- [ ] 切换题目后提示状态重置（已揭示内容清空，按钮重新出现）
- [ ] 深色模式下样式正确
