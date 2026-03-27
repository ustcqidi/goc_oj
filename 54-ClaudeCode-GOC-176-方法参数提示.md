# Claude Code 任务说明：GOC-176 方法参数提示（Signature Help Popup）

**目标**：光标位于 `pen.method(...)` 括号内时，自动弹出方法签名提示弹窗（仿 VS Code Parameter Hints），显示参数名和简短说明；光标离开、输入 `)` 或按 Escape 时自动关闭。帮助孩子记忆各方法的参数含义，无需翻开「📖 指令」面板。

- 只改 `oj/index.html`
- `pen.c()` 已有色板（GOC-175）跳过，不显示参数提示
- 不干扰现有 autocomplete 和 color picker

---

## 一、CSS（GOC-175 样式块之后插入）

```css
/* GOC-176: param hint popup */
.param-hint-popup { position:fixed; background:#fff; border:1px solid #c8c8c8; border-radius:5px; padding:5px 8px; z-index:5001; display:none; font-size:11px; line-height:1.5; max-width:220px; box-shadow:0 3px 12px rgba(0,0,0,.14); pointer-events:none; }
.param-hint-popup.visible { display:block; }
.param-hint-sig { font-family:monospace; font-size:12px; color:#1a1a1a; font-weight:600; }
.param-hint-desc { color:#555; margin-top:2px; }
body.dark-mode .param-hint-popup { background:#2d2d2d; border-color:#555; }
body.dark-mode .param-hint-sig { color:#dcdcaa; }
body.dark-mode .param-hint-desc { color:#aaa; }
```

---

## 二、HTML（`#color-picker-popup` div 之后）

```html
<!-- GOC-176: param hint popup for pen.method() -->
<div class="param-hint-popup" id="param-hint-popup">
  <div class="param-hint-sig" id="param-hint-sig"></div>
  <div class="param-hint-desc" id="param-hint-desc"></div>
</div>
```

---

## 三、JS

### 3.1 在 `_hideColorPicker` 函数之后插入

```javascript
// GOC-176: param hint data + helpers
const _PARAM_HINTS = {
  fd:         { sig: 'fd( 距离 )',           desc: '向前移动，单位像素' },
  forward:    { sig: 'forward( 距离 )',      desc: '向前移动，单位像素' },
  bk:         { sig: 'bk( 距离 )',           desc: '向后移动，单位像素' },
  back:       { sig: 'back( 距离 )',         desc: '向后移动，单位像素' },
  rt:         { sig: 'rt( 角度 )',           desc: '右转，单位度（如 90）' },
  right:      { sig: 'right( 角度 )',        desc: '右转，单位度' },
  lt:         { sig: 'lt( 角度 )',           desc: '左转，单位度（如 90）' },
  left:       { sig: 'left( 角度 )',         desc: '左转，单位度' },
  w:          { sig: 'w( 线宽 )',            desc: '设置画笔线宽（像素）' },
  width:      { sig: 'width( 线宽 )',        desc: '设置画笔线宽（像素）' },
  goto:       { sig: 'goto( x, y )',        desc: '移动到坐标，原点为画布中心' },
  setx:       { sig: 'setx( x )',           desc: '设置 x 坐标（左负右正）' },
  sety:       { sig: 'sety( y )',           desc: '设置 y 坐标（下负上正）' },
  seth:       { sig: 'seth( 角度 )',         desc: '设置朝向：0=上 90=右 180=下' },
  setheading: { sig: 'setheading( 角度 )',   desc: '设置朝向：0=上 90=右 180=下' },
  circle:     { sig: 'circle( 半径 )',       desc: '以当前位置为圆心画圆' },
  oo:         { sig: 'oo( 半径 [, 颜色] )', desc: '以当前位置为圆心画圆' },
  dot:        { sig: 'dot( 直径 )',          desc: '在当前位置画实心圆点' },
  speed:      { sig: 'speed( 速度 )',        desc: '设置动画速度（1 慢 ~ 10 快）' },
  text:       { sig: 'text( "文字" )',       desc: '在当前位置输出文字' },
  repeat:     { sig: 'repeat( 次数 )',       desc: '重复执行 { } 内代码 N 次' },
};

function _checkParamCtx(e) {
  if (e?.key === 'Escape' || e?.key === ')') { _hideParamHint(); return; }
  const ta = document.getElementById('code-editor');
  if (!ta) return;
  const before = ta.value.substring(0, ta.selectionStart);
  const m = before.match(/\bpen\.(\w+)\([^)]*$/);
  if (!m) { _hideParamHint(); return; }
  const info = _PARAM_HINTS[m[1]];
  if (!info) { _hideParamHint(); return; }
  const popup = document.getElementById('param-hint-popup');
  if (!popup) return;
  document.getElementById('param-hint-sig').textContent = 'pen.' + info.sig;
  document.getElementById('param-hint-desc').textContent = info.desc;
  const rect = ta.getBoundingClientRect();
  const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 20;
  const lineNum = ta.value.substring(0, ta.selectionStart).split('\n').length;
  const approxTop = rect.top + lineNum * lineH - ta.scrollTop;
  popup.style.left = (rect.left + 60) + 'px';
  popup.style.top = Math.min(approxTop + 4, rect.bottom - 60) + 'px';
  popup.classList.add('visible');
}

function _hideParamHint() {
  document.getElementById('param-hint-popup')?.classList.remove('visible');
}
```

### 3.2 在 `bindEditorEvents()` 末尾（GOC-175 绑定之后，GOC-173 IIFE 之前）

```javascript
// GOC-176: param hint trigger
ta.addEventListener('input',  _checkParamCtx);
ta.addEventListener('keyup',  _checkParamCtx);
ta.addEventListener('click',  _checkParamCtx);
ta.addEventListener('blur',   _hideParamHint);
```

---

## 四、验收自检

- [ ] 输入 `pen.fd(` → 弹出「pen.fd( 距离 )」+「向前移动，单位像素」提示
- [ ] 输入 `pen.rt(` → 弹出「pen.rt( 角度 )」+「右转，单位度」提示
- [ ] 输入 `pen.goto(` → 弹出「pen.goto( x, y )」提示
- [ ] 输入 `pen.oo(` → 弹出「pen.oo( 半径 [, 颜色] )」提示
- [ ] 输入 `pen.c(` → 不弹出参数提示（由 GOC-175 色板处理）
- [ ] 按 `)` 或 Escape → 提示关闭
- [ ] 光标移到括号外 → 提示消失
- [ ] 编辑器失焦 → 提示关闭
- [ ] 深色模式下提示框背景/字色正确
- [ ] 不影响现有 autocomplete 和色板行为
