# Claude Code 任务说明：GOC-168 画布坐标网格辅助线开关

**目标**：画布工具栏增加「网格」复选框；勾选时在 `#goc-canvas` 上叠加淡灰色网格线（每 40px 一格，中心为龟坐标原点 (0,0)），帮助学生感知步长和坐标方向；不影响判题。

- 只改 `oj/index.html`
- `#goc-canvas` 固定 440×240；`#grid-canvas` 同尺寸叠加其上
- 网格不参与截图/判题（pointer-events: none，不影响 goc-canvas 内容）
- 深色模式下网格线改为半透明白色

---

## 一、HTML

### 1.1 canvas-wrap 内包装双 canvas

将：
```html
<div class="canvas-wrap" id="canvas-wrap">
  <canvas id="goc-canvas" width="440" height="240"></canvas>
  <div class="canvas-coord" id="canvas-coord"></div>
</div>
```
改为：
```html
<div class="canvas-wrap" id="canvas-wrap">
  <div style="position:relative;display:inline-flex">
    <canvas id="goc-canvas" width="440" height="240"></canvas>
    <canvas id="grid-canvas" width="440" height="240" style="position:absolute;top:0;left:0;pointer-events:none;display:none"></canvas>
  </div>
  <div class="canvas-coord" id="canvas-coord"></div>
</div>
```

### 1.2 canvas-toolbar：在「自适应居中」checkbox 前追加「网格」checkbox

```html
<label style="font-size:10px;color:#888;cursor:pointer;display:flex;align-items:center;gap:4px">
  <input type="checkbox" id="grid-cb" style="margin:0"> 网格
</label>
```

---

## 二、JS（init 区末尾追加）

```javascript
// GOC-168: canvas grid overlay
function drawGrid() {
  const gridCanvas = document.getElementById('grid-canvas');
  const cb = document.getElementById('grid-cb');
  if (!gridCanvas) return;
  const show = cb?.checked;
  gridCanvas.style.display = show ? '' : 'none';
  if (!show) return;
  const W = gridCanvas.width, H = gridCanvas.height;
  const ctx = gridCanvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const step = 40, cx = W / 2, cy = H / 2;
  const dark = document.body.classList.contains('dark-mode');
  // Regular grid lines
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = cx % step; x <= W; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
  for (let y = cy % step; y <= H; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
  ctx.stroke();
  // Center axes (more prominent)
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 0.5, 0); ctx.lineTo(cx + 0.5, H);
  ctx.moveTo(0, cy + 0.5); ctx.lineTo(W, cy + 0.5);
  ctx.stroke();
}

document.getElementById('grid-cb')?.addEventListener('change', drawGrid);
// Redraw grid on dark mode toggle (dark mode button click)
document.getElementById('btn-dark')?.addEventListener('click', () => setTimeout(drawGrid, 0));
// Persist checkbox state
const _gridPref = localStorage.getItem('goc_grid');
if (_gridPref === '1') { const cb = document.getElementById('grid-cb'); if (cb) { cb.checked = true; drawGrid(); } }
document.getElementById('grid-cb')?.addEventListener('change', e => {
  localStorage.setItem('goc_grid', e.target.checked ? '1' : '0');
});
```

> 注意：两个 `grid-cb` change listener 合并为一个即可：持久化 + drawGrid 一起。

---

## 三、验收自检

- [ ] 勾选「网格」：画布上出现淡灰色网格线，每格 40px，中心轴更明显
- [ ] 取消勾选：网格消失，画布内容完整
- [ ] 运行代码、画图后网格仍可见（在绘图上方）
- [ ] 截图（💾）只保存 goc-canvas（不含网格）
- [ ] 深色模式下网格线为半透明白色
- [ ] 刷新后网格复选框状态保持（localStorage goc_grid）
- [ ] 深色/浅色切换后网格颜色随之更新
