# Claude Code 任务说明：GOC-160 + GOC-161

## GOC-160：错误信息行号可点击跳转

**目标**：`setResult('error', ...)` 时若消息含「第N行：」，将行号渲染为可点击按钮，点击触发 `highlightErrorLine(N)` 跳到对应行。

### CSS（`.error-line-highlight` 附近）

```css
/* GOC-160: clickable error line button */
.err-line-btn { background:none; border:none; cursor:pointer; color:inherit; font:inherit; text-decoration:underline dotted; padding:0; }
.err-line-btn:hover { opacity:.75; }
```

### JS：修改 `setResult` 中的 `bar.textContent = msg`

将 `bar.textContent = msg;` 替换为：

```javascript
// GOC-160: render clickable line-number for error type
if (type === 'error') {
  const _m = msg.match(/^(❌ )第(\d+)行：(.*)$/s);
  if (_m) {
    bar.innerHTML = escapeHtml(_m[1]) + '<button class="err-line-btn" data-line="' + _m[2] + '">第' + _m[2] + '行</button>：' + escapeHtml(_m[3]);
  } else {
    bar.textContent = msg;
  }
} else {
  bar.textContent = msg;
}
```

### JS：修改 GOC-082 result-bar click handler（加在最前面）

```javascript
document.getElementById('result-bar')?.addEventListener('click', function(e) {
  // GOC-160: err-line-btn jump — must precede the copy handler
  if (e.target.classList.contains('err-line-btn')) {
    highlightErrorLine(parseInt(e.target.dataset.line, 10));
    return; // don't bubble to copy handler
  }
  // GOC-082 existing copy logic ...
```

---

## GOC-161：进度环悬停显示各难度明细 tooltip

**目标**：`updateProgress()` 中计算各难度通过数，将明细写入 `progress-ring-wrap` 的 `title` 属性。

### JS：在 `updateProgress()` 末尾（ringPct 赋值后）追加

```javascript
// GOC-161: difficulty breakdown tooltip on progress ring
const _dc = { easy:0, medium:0, hard:0 }, _dp = { easy:0, medium:0, hard:0 };
problems.forEach(p => {
  if (_dc[p.difficulty] !== undefined) {
    _dc[p.difficulty]++;
    const r = loadRecord(p.id);
    if (r && r.status === 'pass') _dp[p.difficulty]++;
  }
});
const _wrap = document.getElementById('progress-ring-wrap');
if (_wrap) _wrap.title = `⭐ 入门 ${_dp.easy}/${_dc.easy}　🔥 进阶 ${_dp.medium}/${_dc.medium}　💎 高级 ${_dp.hard}/${_dc.hard}`;
```

---

## 验收自检

- [ ] 运行出错时，result 区「第N行」为带下划线可点击按钮
- [ ] 点击「第N行」：编辑器跳到该行、该行被选中高亮
- [ ] 无行号的错误（运行异常）仍为普通文字
- [ ] 鼠标悬停进度环显示「⭐ 入门 X/N　🔥 进阶 X/N　💎 高级 X/N」
- [ ] 通过题目后进度环 tooltip 数字随之更新
- [ ] `docs/实现记录.md` 已更新
