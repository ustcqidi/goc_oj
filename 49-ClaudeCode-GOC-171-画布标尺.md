# Claude Code 任务说明：GOC-171 画布标尺/刻度显示

**目标**：画布工具栏增加「标尺」复选框；勾选时在 `#goc-canvas` 上叠加坐标刻度尺，顶边显示 X 轴 GOC 坐标（-200…0…200），左边显示 Y 轴 GOC 坐标（-120…0…120），每 40px 一刻。

- 只改 `oj/index.html`
- 用 `#ruler-canvas`（同尺寸叠加层）绘制刻度，不影响 goc-canvas 内容和判题
- 深色模式自动换色；偏好 `goc_ruler` 存 localStorage 并加入 PREF_KEYS
- 始终显示默认坐标系（不随 fit-mode 缩放变化）

---

## 一、HTML

### 1.1 ruler-canvas（canvas-wrap 内，turtle-canvas 之后）

```html
<!-- GOC-171: ruler overlay canvas -->
<canvas id="ruler-canvas" width="440" height="240" style="position:absolute;top:0;left:0;pointer-events:none;display:none"></canvas>
```

### 1.2 canvas-toolbar：在「网格」checkbox 后追加「标尺」checkbox

```html
<label style="font-size:10px;color:#888;cursor:pointer;display:flex;align-items:center;gap:4px">
  <input type="checkbox" id="ruler-cb" style="margin:0"> 标尺
</label>
```

---

## 二、JS（init 区，drawGrid 块之后）

```javascript
// GOC-171: canvas ruler overlay
function drawRuler() {
  const rc = document.getElementById('ruler-canvas');
  const cb = document.getElementById('ruler-cb');
  if (!rc) return;
  const show = cb?.checked;
  rc.style.display = show ? '' : 'none';
  if (!show) return;
  const W = rc.width, H = rc.height, cx = W / 2, cy = H / 2, step = 40;
  const ctx = rc.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const dark = document.body.classList.contains('dark-mode');
  const fg  = dark ? 'rgba(200,215,255,0.65)' : 'rgba(50,55,80,0.55)';
  const bg  = dark ? 'rgba(20,22,28,0.62)'    : 'rgba(248,248,255,0.68)';
  ctx.font = '8px monospace';
  ctx.lineWidth = 1;
  ctx.strokeStyle = fg;

  // X ruler (top edge): ticks + labels
  ctx.textAlign = 'center';
  for (let gx = -Math.floor(cx / step) * step; gx <= cx; gx += step) {
    const px = cx + gx;
    if (px < 2 || px > W - 2) continue;
    ctx.beginPath(); ctx.moveTo(px + 0.5, 0); ctx.lineTo(px + 0.5, 5); ctx.stroke();
    const label = String(gx);
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = bg;
    ctx.fillRect(Math.round(px - tw / 2) - 1, 5, Math.ceil(tw) + 2, 9);
    ctx.fillStyle = fg;
    ctx.fillText(label, px, 13);
  }

  // Y ruler (left edge): ticks + labels
  ctx.textAlign = 'left';
  for (let gy = -Math.floor((H - cy) / step) * step; gy <= cy; gy += step) {
    const py = cy - gy;
    if (py < 2 || py > H - 2) continue;
    ctx.beginPath(); ctx.moveTo(0, py + 0.5); ctx.lineTo(5, py + 0.5); ctx.stroke();
    const label = String(gy);
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = bg;
    ctx.fillRect(5, Math.round(py - 4), Math.ceil(tw) + 2, 9);
    ctx.fillStyle = fg;
    ctx.fillText(label, 5, py + 3);
  }
}
document.getElementById('ruler-cb')?.addEventListener('change', e => {
  localStorage.setItem('goc_ruler', e.target.checked ? '1' : '0');
  drawRuler();
});
if (localStorage.getItem('goc_ruler') === '1') {
  const _rcb = document.getElementById('ruler-cb');
  if (_rcb) { _rcb.checked = true; drawRuler(); }
}
```

在 dark mode toggle handler 末尾追加：
```javascript
drawRuler(); // GOC-171
```

PREF_KEYS 追加 `'goc_ruler'`。

---

## 三、验收自检

- [ ] 勾选「标尺」：画布顶边出现 X 轴刻度（-200…200），左边出现 Y 轴刻度（-120…120）；步长 40，0 对应画布中心
- [ ] 取消勾选：标尺消失，画布内容完整
- [ ] 深色模式下标尺换色
- [ ] 刷新后勾选状态保持（localStorage goc_ruler）
- [ ] 截图（💾）不含标尺
- [ ] 进度重置/备份不清除标尺偏好
