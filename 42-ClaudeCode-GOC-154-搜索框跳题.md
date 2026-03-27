# Claude Code 任务说明：GOC-154 搜索框 `#数字` 直接跳题

**目标**：搜索框输入 `#42` 时立即跳到第 42 题并清空搜索框，不触发筛选。

---

## 一、硬性要求

- 只改 `oj/index.html`。
- 匹配规则：`/^#(\d+)$/`（以 `#` 开头后跟纯数字，前后无多余字符）。
- 找不到对应题目时不跳转（静默忽略，不弹 alert）。
- 跳转后清空搜索框、隐藏清除按钮、重置 `currentSearch = ''` 并重渲侧栏（使跳转题目高亮）。
- `placeholder` 改为 `搜索题目… 或 #编号跳转`。

---

## 二、HTML

```html
<!-- 修改 id="search-input" 的 placeholder -->
<input type="text" id="search-input" placeholder="搜索题目… 或 #编号跳转" autocomplete="off">
```

---

## 三、JS（在 search-input 的 input 事件处理开头插入）

```javascript
searchInput.addEventListener('input', () => {
  const raw = searchInput.value.trim();
  // GOC-154: #number jump
  const jumpMatch = raw.match(/^#(\d+)$/);
  if (jumpMatch) {
    const target = problems.find(p => String(p.id) === jumpMatch[1]);
    if (target) {
      loadProblem(target);
      searchInput.value = '';
      currentSearch = '';
      if (searchClearBtn) searchClearBtn.classList.remove('visible');
      renderSidebar(currentFilter, currentTag, currentCurriculum);
    }
    return;
  }
  currentSearch = raw;
  if (searchClearBtn) searchClearBtn.classList.toggle('visible', currentSearch.length > 0);
  renderSidebar(currentFilter, currentTag, currentCurriculum);
});
```

---

## 四、验收自检

- [ ] 搜索框输入 `#1` 跳到第 1 题，搜索框清空
- [ ] 输入 `#999`（不存在题号）无任何反应
- [ ] 输入 `#42abc` 不触发跳转，正常走搜索逻辑
- [ ] 跳转后侧栏该题高亮（active 类）
- [ ] placeholder 显示 `搜索题目… 或 #编号跳转`
- [ ] `docs/实现记录.md` 已更新
