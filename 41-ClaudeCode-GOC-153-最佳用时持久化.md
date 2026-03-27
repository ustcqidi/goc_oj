# Claude Code 任务说明：GOC-153 做题计时器 — 最佳用时持久化

**目标**：提交通过时将当前用时（秒）存入 `goc_time_{id}`（保留更优值）；侧栏已通过题目 p-meta 追加 ⏱ 最佳用时小灰字。

---

## 一、硬性要求

- 只改 `oj/index.html`。
- 计时器已有（GOC-091），变量 `_timerStart` 在同一闭包，直接读取。
- `goc_time_{id}` 存秒数字符串；自动被 GOC-151 备份/恢复（不在 PREF_KEYS）。
- 仅在**本次提交通过**时更新，已有最佳时间时取较小值。

---

## 二、JS

### 2.1 helpers（Storage helpers 附近）

```javascript
function loadBestTime(id) { const v = localStorage.getItem('goc_time_' + id); return v ? parseInt(v, 10) : null; }
function saveBestTime(id, sec) {
  const existing = loadBestTime(id);
  if (existing === null || sec < existing) localStorage.setItem('goc_time_' + id, sec);
}
function formatTimeSec(sec) { return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
```

### 2.2 submitCode — verdict.pass 块内（紧跟 saveRecord 之后）

```javascript
// GOC-153: save best time on pass
const _elapsedSec = Math.floor((Date.now() - _timerStart) / 1000);
saveBestTime(currentProblem.id, _elapsedSec);
```

### 2.3 renderSidebar — p-meta 内，📝 图标之后

```javascript
const bestSec = rec && rec.status === 'pass' ? loadBestTime(p.id) : null;
// p-meta 内加：
${bestSec !== null ? `<span style="font-size:10px;color:#aaa" title="最佳用时">⏱${formatTimeSec(bestSec)}</span>` : ''}
```

---

## 三、验收自检

- [ ] 提交通过时 `goc_time_{id}` 被写入 localStorage
- [ ] 再次通过且用时更短时，值更新为较小值；用时更长时不变
- [ ] 侧栏已通过题目 p-meta 显示 `⏱m:ss` 小灰字
- [ ] 未通过/未做的题目不显示时间
- [ ] `docs/实现记录.md` 已更新
