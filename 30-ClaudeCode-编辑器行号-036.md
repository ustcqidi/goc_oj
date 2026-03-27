# Claude Code 任务说明：代码编辑器显示行号（GOC-036）

**目标**：在代码编辑区左侧增加行号列，与代码逐行对齐并同步滚动，便于定位错误、讲解「第 N 行」。

---

## 硬性要求

- **全部由 Claude Code 自己做完**：按下面实现要点完成行号层与联动，不要中途停下来等用户。
- **不要用户干预**：不向用户提问、不要求确认；遇到歧义按本文档约定自行决定。
- **完成后**：在 `goc/docs/实现记录.md` 中增加「GOC-036 编辑器行号 已执行」段落，列出修改的文件与验收结论。

---

## 复制给 Claude Code 的「一句话任务」（可直接粘贴）

```
请按文档 30-ClaudeCode-编辑器行号-036.md 在代码编辑区左侧增加行号列，与代码逐行对齐并同步滚动。工作目录 goc/，仅修改 goc/oj/index.html。行号层与现有 textarea/高亮层（highlight-layer）同高、同滚动；行数随内容变化更新。不要向我提问。完成后更新 goc/docs/实现记录.md。
```

---

## 任务概览

| 项目 | 内容 |
|------|------|
| **GOC-ID** | GOC-036 |
| **需求** | 编辑区左侧显示行号，与代码对齐、同步滚动 |
| **范围** | goc/oj/index.html（editor-wrapper 内新增行号层、样式、滚动与行数更新逻辑） |
| **必读** | goc/11-产品持续优化-思路与想法.md（§2.3 GOC-036、§六 组 I）；现有 oj 中 editor-wrapper、highlight-layer、code-editor textarea 结构 |

---

## 实现要点

1. **DOM 结构**  
   - 在 **editor-wrapper** 内、现有 **highlight-layer** 与 **textarea** 左侧，增加一行号容器（如 `<div class="line-numbers" id="line-numbers">` 或 `<pre class="line-numbers" aria-hidden="true">`）。  
   - 行号列固定宽度（如 2.5em 或 36px），右对齐，字体与代码区一致（等宽），字号与代码一致或略小；颜色为次要文字色，不抢眼。

2. **行号内容**  
   - 根据 textarea 的 value 按换行符 `\n` 拆分为行，行数为 N 时显示 1～N。  
   - 每次 value 变化（input 事件）或首次渲染时，重新计算行数并更新行号层的文本（如每行一个数字 + 换行，或每个数字放在独立 div 中以便单独样式）。

3. **滚动同步**  
   - 行号层与 textarea（及 highlight-layer）**垂直滚动一致**：将行号层与代码区放在同一可滚动容器内，或监听 textarea 的 scroll 事件，把 scrollTop 赋给行号层，使行号层与代码区同高、同 scrollTop。  
   - 若当前结构是 textarea 与 highlight-layer 叠放且共享滚动，行号层应作为同一滚动容器的左侧固定列：可用 flex 布局，左侧行号、右侧为可滚动的代码区（textarea + 高亮层），这样滚动自然一致。

4. **布局**  
   - 推荐：`editor-wrapper` 为 `display: flex`；左侧 `line-numbers` 固定宽度、overflow hidden 或 scroll 与右侧一致；右侧为现有代码区（含高亮 + textarea），overflow auto。  
   - 行号层与代码区同高（min-height 一致），行号内容若超出可随右侧一起滚动（行号层 scrollTop 与右侧 scrollTop 绑定）。

5. **可选**  
   - 当前行高亮：根据 selectionStart 算出光标所在行，在行号层对应行加 class 高亮。  
   - 错误行高亮：若已有 GOC-003 错误行号，可在行号层该行加错误样式。

---

## 验收清单

- [ ] 编辑区左侧可见行号，从 1 开始连续编号。
- [ ] 增删行时代码行数变化，行号随之更新。
- [ ] 纵向滚动时代码与行号同步，不错位。
- [ ] 行号列宽度固定，不挤压代码区；字体/颜色与整体风格一致（含极客风若已启用）。
- [ ] 现有高亮、补全、格式化、错误行高亮等功能仍正常。
- [ ] `goc/docs/实现记录.md` 已更新，记录 GOC-036 与修改文件。

---

## 交付物

1. **代码**：goc/oj/index.html 中增加行号层 DOM、CSS 与行数/滚动同步的 JS 逻辑。
2. **文档**：goc/docs/实现记录.md 新增「GOC-036 编辑器行号」段落，含修改文件列表与验收结论。
