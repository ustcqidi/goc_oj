# Claude Code 任务说明：GOC-164 断点 + 单步执行行高亮

**目标**：
1. 点击行号区设置/取消断点（红色圆点）
2. 单步执行时编辑器当前执行行高亮（黄色）
3. 连续播放遇断点自动暂停，显示「⏸ 断点暂停在第N行」

轨迹步已含 `step.line` 字段（来自 goc-executor.js），直接使用。

---

## 一、硬性要求
- 只改 `oj/index.html`
- 不改 goc-executor.js（已有 line 字段）
- `updateLineNumbers()` 改为 innerHTML（加 span，支持断点/当前行 class）
- 行号区点击通过 span 的 data-line 属性识别行号

---

## 二、CSS（error-line-highlight 附近）

```css
/* GOC-164: step debugger */
.step-line-highlight { position: absolute; left: 0; right: 0; background: rgba(255,214,0,.18); pointer-events: none; border-left: 3px solid #ffd600; }
body.dark-mode .step-line-highlight { background: rgba(255,214,0,.12); }
.ln-bp  { color: #e53935 !important; font-weight: 700; }
.ln-cur { background: rgba(255,214,0,.45); border-radius: 2px; color: #333 !important; }
body.dark-mode .ln-cur { background: rgba(255,214,0,.25); color: #fff !important; }
.line-numbers { cursor: pointer; }
```

---

## 三、JS

### 3.1 新状态变量（stepTraj 附近）

```javascript
let breakpoints = new Set(); // GOC-164: breakpoint line numbers (1-indexed)
let currentStepLineNum = null; // GOC-164: currently executing line
```

### 3.2 修改 updateLineNumbers()

从 `ln.textContent = ...` 改为 `ln.innerHTML`：

```javascript
function updateLineNumbers() {
  const ta = document.getElementById('code-editor');
  const ln = document.getElementById('line-numbers');
  if (!ta || !ln) return;
  const count = ta.value.split('\n').length;
  ln.innerHTML = Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const cls = (breakpoints.has(n) ? ' ln-bp' : '') + (currentStepLineNum === n ? ' ln-cur' : '');
    return `<span data-line="${n}"${cls ? ` class="${cls.trim()}"` : ''}>${breakpoints.has(n) ? '●' : n}</span>`;
  }).join('\n');
  ln.scrollTop = ta.scrollTop;
}
```

### 3.3 新函数 highlightCurrentStepLine()（highlightErrorLine 附近）

```javascript
function highlightCurrentStepLine(lineNum) {
  const hl = document.getElementById('highlight-layer');
  hl?.querySelectorAll('.step-line-highlight').forEach(el => el.remove());
  if (!lineNum) return;
  const ta = document.getElementById('code-editor');
  if (!ta) return;
  const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 20;
  const paddingTop = parseFloat(getComputedStyle(ta).paddingTop) || 12;
  const div = document.createElement('div');
  div.className = 'step-line-highlight';
  div.style.top = (paddingTop + (lineNum - 1) * lineH) + 'px';
  div.style.height = lineH + 'px';
  hl.appendChild(div);
  // Scroll to show current line
  ta.scrollTop = Math.max(0, (lineNum - 4) * lineH);
  hl.scrollTop = ta.scrollTop;
  document.getElementById('line-numbers').scrollTop = ta.scrollTop;
}
```

### 3.4 行号区点击（bindEditorEvents 里）

```javascript
// GOC-164: breakpoint toggle on line-number click
document.getElementById('line-numbers')?.addEventListener('click', e => {
  const span = e.target.closest('[data-line]');
  if (!span) return;
  const n = parseInt(span.dataset.line, 10);
  if (breakpoints.has(n)) breakpoints.delete(n);
  else breakpoints.add(n);
  updateLineNumbers();
});
```

### 3.5 修改 stepOnce() — 步后高亮当前行

在 `updateStepPos()` 后追加：
```javascript
// GOC-164: highlight current execution line
currentStepLineNum = stepTraj[stepIdx - 1]?.line || null;
highlightCurrentStepLine(currentStepLineNum);
updateLineNumbers();
```

### 3.6 修改 initStepRun() — 进入单步时显示第一行

在 `updateStepPos()` 后追加：
```javascript
// GOC-164: show first step's line
currentStepLineNum = stepTraj[0]?.line || null;
highlightCurrentStepLine(currentStepLineNum);
updateLineNumbers();
```

### 3.7 修改 continueFromStep() — 断点暂停

```javascript
function continueFromStep() {
  if (stepTraj.length === 0) return;
  const canvas = document.getElementById('goc-canvas');
  const delay = Math.round(50 / currentSpeed);
  const _resumeIdx = stepIdx; // GOC-164: skip bp check for this exact step
  animState.timer = setInterval(() => {
    if (stepIdx >= stepTraj.length) {
      cancelAnimation();
      currentStepLineNum = null; highlightCurrentStepLine(null); updateLineNumbers();
      setResult('idle', `运行完成，共 ${stepTraj.length} 步。`);
      return;
    }
    const batch = Math.max(1, Math.round(currentSpeed));
    for (let b = 0; b < batch && stepIdx < stepTraj.length; b++, stepIdx++) {
      // GOC-164: breakpoint check (skip the step we resumed from)
      if (breakpoints.size > 0 && stepIdx !== _resumeIdx && breakpoints.has(stepTraj[stepIdx]?.line)) {
        cancelAnimation();
        currentStepLineNum = stepTraj[stepIdx].line;
        highlightCurrentStepLine(currentStepLineNum);
        updateLineNumbers();
        updateStepPos();
        setResult('running', `⏸ 断点暂停在第 ${stepTraj[stepIdx].line} 行，按「下一步」或「继续」`);
        return;
      }
      GOCRenderer.applyStep(stepCtx, stepTraj[stepIdx], stepState, canvas.width, canvas.height, stepTransform);
    }
    updateStepPos();
  }, delay);
  setResult('running', `动画播放中… (${stepTraj.length} 步)`);
}
```

### 3.8 修改 exitStepMode() — 清除高亮

在 `clearCanvas()` 前追加：
```javascript
// GOC-164: clear step debug state
currentStepLineNum = null;
highlightCurrentStepLine(null);
updateLineNumbers();
```

### 3.9 修改 loadProblem — 切换题目时清除断点

在 GOC-157 块前追加：
```javascript
// GOC-164: clear breakpoints on problem switch
breakpoints.clear();
```

---

## 四、验收自检
- [ ] 点击行号出现红色圆点（●），再点取消
- [ ] 进入单步模式，第一步的行在编辑器内黄色高亮
- [ ] 每次「下一步」黄色高亮跟随当前执行行移动
- [ ] 设置断点后「继续」播放，到断点行自动暂停，结果栏显示「⏸ 断点暂停在第N行」
- [ ] 「继续」后从断点位置恢复，不会在同一断点无限循环
- [ ] `exitStepMode()`（退出单步）清除黄色高亮
- [ ] 切换题目清除断点
