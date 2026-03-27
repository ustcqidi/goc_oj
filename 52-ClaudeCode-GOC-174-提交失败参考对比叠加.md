# Claude Code 任务说明：GOC-174 提交失败后叠加参考对比

**目标**：提交答案**失败**后，画布工具栏出现「对比参考」checkbox；勾选时在 `#compare-canvas`（顶层叠加，无不透明背景）以半透明琥珀色渲染期望图形，叠加在学生作答图之上，让学生直观看到「哪里画错了」。

- 只改 `oj/index.html`
- 默认隐藏「对比参考」控件，仅提交失败后出现；重新运行或切换题目时自动隐藏并清空
- 深色模式换色；不影响截图（pointer-events:none）
- 向下兼容：无 expectedTrajectory 的题目不出现对比控件

---

## 一、CSS（`.hint-reveal-item strong` 之后）

```css
/* GOC-174: compare overlay */
#compare-canvas { opacity: 0.55; filter: sepia(1) hue-rotate(5deg) saturate(6) brightness(0.75); display: none; }
body.dark-mode #compare-canvas { filter: sepia(1) hue-rotate(195deg) saturate(4) brightness(1.3); opacity: 0.5; }
```

---

## 二、HTML

### 2.1 canvas-wrap 内 inner wrapper（`crosshair-canvas` 之后）

```html
<!-- GOC-174: compare overlay canvas -->
<canvas id="compare-canvas" width="440" height="240" style="position:absolute;top:0;left:0;pointer-events:none;display:none"></canvas>
```

### 2.2 canvas-toolbar（ruler-cb label 之后，fit-mode-cb 之前）

```html
<!-- GOC-174: compare reference (visible only after submit fail) -->
<label id="compare-label" style="font-size:10px;color:#e67c00;cursor:pointer;display:none;align-items:center;gap:4px">
  <input type="checkbox" id="compare-cb" style="margin:0"> 对比参考
</label>
```

---

## 三、JS

### 3.1 dark mode toggle handler 末尾追加

```javascript
drawCompare(); // GOC-174
```

### 3.2 在 ruler restore 块之后插入 drawCompare 函数 + change handler

```javascript
// GOC-174: compare overlay
function drawCompare() {
  const cc = document.getElementById('compare-canvas');
  const cb = document.getElementById('compare-cb');
  if (!cc) return;
  const show = cb?.checked;
  cc.style.display = show ? '' : 'none';
  if (!show) { cc.getContext('2d').clearRect(0, 0, cc.width, cc.height); return; }
  const expected = currentProblem && expectedTrajCache[currentProblem.id];
  if (!expected || !expected.length) { cc.style.display = 'none'; return; }
  const ctx = cc.getContext('2d');
  ctx.clearRect(0, 0, cc.width, cc.height); // transparent — no drawBackground
  const fitMode = document.getElementById('fit-mode-cb')?.checked;
  const transform = fitMode ? GOCRenderer.computeFitTransform(expected, cc.width, cc.height, 20) : null;
  const state = GOCRenderer.createState();
  for (const step of expected) {
    GOCRenderer.applyStep(ctx, step, state, cc.width, cc.height, transform);
  }
}
document.getElementById('compare-cb')?.addEventListener('change', drawCompare);
```

### 3.3 submit 失败路径（`saveRecord(..., 'fail')` 之后）

```javascript
// GOC-174: show compare button after fail
const _cmpLabel = document.getElementById('compare-label');
if (_cmpLabel && currentProblem && expectedTrajCache[currentProblem.id]) {
  _cmpLabel.style.display = 'flex';
}
```

### 3.4 loadProblem（hint reset 块之后）

```javascript
// GOC-174: reset compare on problem switch
const _cmpLabel174 = document.getElementById('compare-label');
const _cmpCb174    = document.getElementById('compare-cb');
const _cmpCc174    = document.getElementById('compare-canvas');
if (_cmpLabel174) _cmpLabel174.style.display = 'none';
if (_cmpCb174)    _cmpCb174.checked = false;
if (_cmpCc174)    _cmpCc174.style.display = 'none';
```

### 3.5 runCode() 开头（cancelAnimation() 之后）

```javascript
// GOC-174: hide compare on new run
const _cmpLr = document.getElementById('compare-label');
const _cmpCr = document.getElementById('compare-cb');
const _cmpCc = document.getElementById('compare-canvas');
if (_cmpLr) _cmpLr.style.display = 'none';
if (_cmpCr) _cmpCr.checked = false;
if (_cmpCc) _cmpCc.style.display = 'none';
```

---

## 四、验收自检

- [ ] 提交**通过**：不出现「对比参考」控件
- [ ] 提交**失败**：工具栏出现琥珀色「对比参考」checkbox
- [ ] 勾选「对比参考」：期望图形以半透明琥珀色叠加在学生图形之上
- [ ] 取消勾选：叠加层消失，学生图形完整
- [ ] 重新「运行」后：控件消失，对比层清除
- [ ] 切换题目后：控件消失，对比层清除
- [ ] 深色模式下对比颜色变为蓝绿色调
- [ ] 无 expectedTrajectory 的题目提交失败后：不出现「对比参考」控件
- [ ] 截图（💾）不含对比叠加层（pointer-events:none，不影响 goc-canvas）
