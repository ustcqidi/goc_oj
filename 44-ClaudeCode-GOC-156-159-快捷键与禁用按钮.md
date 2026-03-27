# Claude Code 任务说明：GOC-156 + GOC-159

## GOC-156：`Ctrl+B` 折叠/展开侧边栏

**目标**：焦点不在编辑器/输入框时，`Ctrl+B`（或 `Cmd+B`）触发侧边栏折叠，复用现有 `sidebar-collapse-btn` 逻辑。`Ctrl+/` 被 GOC-093 占用，故改用 `Ctrl+B`（VS Code 同款）。

### JS（追加在 GOC-106 initSidebarCollapse 之后）

```javascript
// GOC-156: Ctrl+B toggle sidebar (focus not in editor)
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault();
    document.getElementById('sidebar-collapse-btn')?.click();
  }
});
```

### 快捷键弹窗补充

在 shortcut-popup 中追加：

```html
<div class="shortcut-row"><span class="shortcut-key">Ctrl+B</span><span class="shortcut-desc">折叠/展开侧边栏</span></div>
```

---

## GOC-159：代码为空时运行/提交按钮灰显

**目标**：`code-editor` 内容为空（trim 后）时，`btn-run` 和 `btn-submit` 置为 `disabled`；有内容时恢复。`loadProblem` 后也立即更新状态。

### CSS（`.btn` 附近）

```css
/* GOC-159: disabled run/submit */
.btn-run:disabled, .btn-submit:disabled { opacity: .4; cursor: not-allowed; pointer-events: none; }
```

### JS

```javascript
// GOC-159: disable run/submit when editor empty
function updateRunBtns() {
  const empty = !document.getElementById('code-editor')?.value.trim();
  const r = document.getElementById('btn-run');
  const s = document.getElementById('btn-submit');
  if (r) { r.disabled = empty; r.title = empty ? '请先写代码' : ''; }
  if (s) { s.disabled = empty; s.title = empty ? '请先写代码' : '提交答案'; }
}
```

- 在 `code-editor` 的 `input` 事件里调用 `updateRunBtns()`
- 在 `loadProblem` 末尾（GOC-157 块之后）调用 `updateRunBtns()`

---

## 验收自检

- [ ] 编辑器清空后「运行」「提交」灰显，鼠标悬停显示「请先写代码」
- [ ] 输入任意字符后按钮立即恢复
- [ ] `loadProblem` 切换到空 starterCode 题目时按钮也灰显
- [ ] `Ctrl+B`（焦点不在编辑器时）折叠/展开侧边栏
- [ ] shortcut-popup 中有 `Ctrl+B` 条目
- [ ] `docs/实现记录.md` 已更新
