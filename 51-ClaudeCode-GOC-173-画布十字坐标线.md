# Claude Code 任务说明：GOC-173 画布鼠标悬停十字坐标线

**目标**：在 `#goc-canvas` 区域移动鼠标时，`#crosshair-canvas`（最顶层叠加层）实时绘制虚线十字光标，并在光标旁显示对应 GOC 坐标 `(x, y)`；鼠标离开时清除。配合 GOC-171 标尺 + GOC-168 网格，让学生直观感知任意位置的坐标值。

- 只改 `oj/index.html`
- `#crosshair-canvas` 无开关，十字线悬停时自动出现/消失，不影响画布内容和判题
- 深色模式自动换色

---

## 一、HTML（canvas-wrap 内 inner wrapper，`ruler-canvas` 之后）

```html
<!-- GOC-173: crosshair overlay canvas -->
<canvas id="crosshair-canvas" width="440" height="240" style="position:absolute;top:0;left:0;pointer-events:none"></canvas>
```

> 注意：不加 `display:none`，canvas 默认透明，清空后等同隐藏。

---

## 二、JS（`bindEditorEvents()` 末尾，`// GOC-170` 块之后）

```javascript
// GOC-173: canvas crosshair on mouse hover
(function() {
  const gc = document.getElementById('goc-canvas');
  const cc = document.getElementById('crosshair-canvas');
  if (!gc || !cc) return;
  const W = cc.width, H = cc.height, cx = W / 2, cy = H / 2;
  function clearCross() { cc.getContext('2d').clearRect(0, 0, W, H); }
  gc.addEventListener('mousemove', e => {
    const rect = gc.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    if (px < 0 || py < 0 || px > W || py > H) { clearCross(); return; }
    const ctx = cc.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const dark = document.body.classList.contains('dark-mode');
    ctx.strokeStyle = dark ? 'rgba(100,160,255,0.35)' : 'rgba(40,60,200,0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(Math.round(px) + 0.5, 0); ctx.lineTo(Math.round(px) + 0.5, H);
    ctx.moveTo(0, Math.round(py) + 0.5); ctx.lineTo(W, Math.round(py) + 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
    // Coordinate label
    const gx = Math.round(px - cx), gy = Math.round(cy - py);
    const label = `(${gx}, ${gy})`;
    ctx.font = '9px monospace';
    const tw = ctx.measureText(label).width;
    const lx = px + 6 + tw + 4 < W ? px + 6 : px - tw - 10;
    const ly = py + 14 < H - 2 ? py + 14 : py - 4;
    ctx.fillStyle = dark ? 'rgba(18,20,26,0.72)' : 'rgba(248,248,255,0.80)';
    ctx.fillRect(Math.round(lx) - 2, Math.round(ly) - 9, Math.ceil(tw) + 4, 11);
    ctx.fillStyle = dark ? 'rgba(120,170,255,0.92)' : 'rgba(30,50,180,0.85)';
    ctx.fillText(label, Math.round(lx), Math.round(ly));
  });
  gc.addEventListener('mouseleave', clearCross);
})();
```

---

## 三、快捷键面板补全（shortcut-popup，追加两条）

在现有 `Ctrl+F` 行之后追加：

```html
<div class="shortcut-row"><span class="shortcut-key">Enter</span><span class="shortcut-desc">自动继承上一行缩进</span></div>
<div class="shortcut-row"><span class="shortcut-key">Ctrl+Space</span><span class="shortcut-desc">触发自动补全</span></div>
```

---

## 四、验收自检

- [ ] 鼠标移入画布：出现虚线十字光标 + `(x, y)` 标签
- [ ] 十字坐标与标尺数字对齐（例如 ruler 显示 x=40 的刻度线，鼠标移到那里标签也显示 40）
- [ ] 鼠标离开画布：十字线消失
- [ ] 深色模式下十字线/标签换色
- [ ] 画布内容、网格、标尺不受影响
- [ ] 快捷键面板新增 Enter（继承缩进）+ Ctrl+Space（补全）两行
