# Claude Code 任务说明：GOC-169 编辑器 Enter 自动继承缩进

**目标**：在代码编辑器中，按 `Enter` 后新行自动插入与上一行相同数量的前导空格（只继承，不智能增减），减少手动按 Tab 的摩擦。

- 只改 `oj/index.html`
- 只继承当前行前导空白；若当前行无缩进，允许浏览器默认行为
- 不干扰 `Ctrl+Enter`（运行）、`Shift+Ctrl+Enter`（提交）等已有快捷键
- 不干扰 autocomplete 下拉：autocomplete 可见时 Enter 已有处理逻辑（选中候选项），继续走原路

---

## 一、JS（在 `ta.addEventListener('keydown', ...)` 处，Tab 段落后追加）

在 Tab indentation 处理之后、`// GOC-093` 注释前插入：

```javascript
// GOC-169: Enter auto-inherit indent
if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
  const s = ta.selectionStart;
  const lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
  const indent = ta.value.substring(lineStart, s).match(/^(\s*)/)[1];
  if (indent.length > 0) {
    e.preventDefault();
    const selEnd = ta.selectionEnd;
    ta.value = ta.value.substring(0, s) + '\n' + indent + ta.value.substring(selEnd);
    ta.selectionStart = ta.selectionEnd = s + 1 + indent.length;
    updateHighlight();
  }
  // No indent → default Enter behavior
}
```

---

## 二、验收自检

- [ ] 第一行无缩进代码按 Enter → 新行从行首开始（默认行为不变）
- [ ] `    pen.fd(100);` 按 Enter → 新行自动有 4 个空格缩进
- [ ] 混合缩进（Tab + 空格）→ 完整继承前导字符
- [ ] 有选中文本时按 Enter → 删除选中内容，新行继承光标所在行缩进
- [ ] Ctrl+Enter 仍触发「运行」，不受影响
- [ ] Autocomplete 下拉展开时按 Enter → 选中候选项（原行为），不触发缩进逻辑
