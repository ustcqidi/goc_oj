# Claude Code 任务说明：GOC-149 题目星标/收藏

**目标**：侧栏每道题右侧加 ☆/★ 收藏按钮，持久化到 localStorage；状态筛选行增加「⭐ 收藏」chip，点击后只显示收藏题目。

---

## 一、硬性要求

- 全部由 Claude Code 自己做完，不要停下来等用户。
- 最小改动：只改 `oj/index.html`，不改其他文件。
- 向后兼容：不影响现有筛选、状态统计、localStorage 结构。

---

## 二、具体修改清单

### CSS（加在现有 `.status-btn` 样式块附近）

```css
/* GOC-149: Star button */
.star-btn {
  background: none; border: none; cursor: pointer;
  font-size: 13px; padding: 0 2px; color: #bbb;
  line-height: 1; flex-shrink: 0;
  transition: color .15s, transform .12s;
}
.star-btn:hover { color: #f5a623; transform: scale(1.2); }
.star-btn.starred { color: #f5a623; }
```

### HTML（status-filter 增加一个 chip）

```html
<!-- 在 data-status="fail" 按钮后新增 -->
<button class="status-btn" data-status="star">⭐ 收藏</button>
```

### JS 状态变量（在 `currentStatus` 声明附近）

```javascript
// GOC-149: star helper
function isStar(id) { return !!localStorage.getItem('goc_star_' + id); }
function toggleStar(id) {
  if (isStar(id)) localStorage.removeItem('goc_star_' + id);
  else localStorage.setItem('goc_star_' + id, '1');
}
```

`currentStatus` 已有 `'all'|'todo'|'pass'|'fail'`，直接复用，新增 `'star'` 作为第五种状态。

### renderSidebar 修改

**① star 筛选（紧接 currentStatus 的 fail 分支后）**：

`currentStatus === 'star'` 时：`filtered = filtered.filter(p => isStar(p.id))`

**② 题目项 HTML 加星标按钮**：

在 `item.innerHTML` 末尾（`.p-meta` 内或 item 后追加）插入：

```javascript
const starCls = isStar(p.id) ? ' starred' : '';
// 在 item.innerHTML 中加：
`<button class="star-btn${starCls}" data-id="${p.id}" title="${isStar(p.id)?'取消收藏':'收藏'}">
  ${isStar(p.id) ? '★' : '☆'}
</button>`
```

**③ 星标按钮 click 事件（stopPropagation！）**：

```javascript
item.querySelector('.star-btn')?.addEventListener('click', e => {
  e.stopPropagation(); // 不触发 loadProblem
  const id = e.currentTarget.dataset.id;
  toggleStar(id);
  // 若当前在 star 筛选模式，重新渲染；否则只更新按钮
  if (currentStatus === 'star') {
    renderSidebar(currentFilter, currentTag, currentCurriculum);
  } else {
    e.currentTarget.classList.toggle('starred', isStar(id));
    e.currentTarget.textContent = isStar(id) ? '★' : '☆';
    e.currentTarget.title = isStar(id) ? '取消收藏' : '收藏';
  }
});
```

### filter summary 更新

在 parts[] 构建中，`currentStatus === 'star'` 时加入 `'⭐ 收藏'`：

```javascript
if (currentStatus !== 'all') parts.push(
  {todo:'未做',pass:'已通过',fail:'未通过',star:'⭐ 收藏'}[currentStatus] || currentStatus
);
```

### clear-filter handler 更新

`currentStatus = 'all'` 已在现有 clear 逻辑中，无需额外修改（star chip 会随之被取消激活）。

status-btn 的 `.active` class 切换逻辑已复用现有代码，`data-status="star"` 天然兼容。

---

## 三、不做的事

- ❌ 不修改 localStorage 的 `goc_*` 记录结构
- ❌ 不在题目面板显示星标（侧栏够用）
- ❌ 不实现批量收藏/导出

---

## 四、验收自检

- [ ] 侧栏每道题右侧有 ☆ 按钮，点击变 ★（金色），再点取消
- [ ] 点星不会触发加载题目（stopPropagation）
- [ ] 「⭐ 收藏」chip 显示在状态筛选行，点击后只显示已收藏题目
- [ ] 清除筛选后星标按钮状态不变（只清除筛选条件，不清除收藏数据）
- [ ] filter-summary 在收藏筛选时显示「⭐ 收藏」标签
- [ ] `docs/实现记录.md` 已更新
