# Claude Code 任务说明：GOC-150 代码片段模板（Snippets）

**目标**：工具栏「📄 模板」按钮，点击展开含 8 个完整代码模板的面板，点击「插入」将完整多行代码插入编辑器光标处。与现有「📖 指令」单行 snippet 互补，「指令」是语法速查，「模板」是完整可运行程序示例。

---

## 一、硬性要求

- 只改 `oj/index.html`，不改其他文件。
- `insertSnippet()` 和 `updateHighlight()` 已存在，直接复用。
- 面板样式与 ref-panel 保持风格统一（边框、背景、字体）。

---

## 二、8 个模板内容

```javascript
const SNIPPET_TEMPLATES = [
  { name:'正方形',      desc:'for循环画4条边',        code:'for(int i=0; i<4; i++){\n    pen.fd(100).rt(90);\n}' },
  { name:'等边三角形',  desc:'for循环画3条边',        code:'for(int i=0; i<3; i++){\n    pen.fd(100).rt(120);\n}' },
  { name:'正多边形',    desc:'n边形（修改n）',         code:'int n = 6;\nfor(int i=0; i<n; i++){\n    pen.fd(80).rt(360/n);\n}' },
  { name:'同心圆',      desc:'for循环画多圆',          code:'for(int i=1; i<=5; i++){\n    pen.o(i*20);\n}' },
  { name:'螺旋线',      desc:'边长递增右转螺旋',       code:'for(int i=1; i<=20; i++){\n    pen.fd(i*5).rt(90);\n}' },
  { name:'自定义函数',  desc:'函数定义+调用框架',      code:'void drawShape(int n){\n    for(int i=0; i<n; i++){\n        pen.fd(80).rt(360/n);\n    }\n}\n\ndrawShape(6);' },
  { name:'for循环框架', desc:'通用循环模板',            code:'for(int i=0; i<10; i++){\n    // 在这里写代码\n}' },
  { name:'cin读入',     desc:'读取一个整数n',           code:'int n;\ncin >> n;\n' },
];
```

---

## 三、CSS（加在 `.ref-panel` 样式附近）

```css
/* GOC-150: Snippet templates panel */
.snip-panel { border-bottom: 1px solid var(--goc-border); background: #fafafa; overflow-y: auto; max-height: 200px; flex-shrink: 0; padding: 6px 10px; display: flex; flex-wrap: wrap; gap: 6px; }
.snip-panel.hidden { display: none; }
.snip-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 5px 8px; display: flex; flex-direction: column; gap: 2px; cursor: default; min-width: 110px; max-width: 160px; transition: border-color .15s; }
.snip-card:hover { border-color: var(--goc-primary); }
.snip-card-name { font-size: 11.5px; font-weight: 600; color: #333; }
.snip-card-desc { font-size: 10px; color: #888; }
.snip-insert-btn { margin-top: 3px; font-size: 10px; padding: 1px 6px; background: var(--goc-primary); color: #fff; border: none; border-radius: 3px; cursor: pointer; align-self: flex-start; transition: opacity .15s; }
.snip-insert-btn:hover { opacity: .85; }
.btn-snip { background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9; }
.btn-snip:hover { background: #bbdefb; }
.btn-snip.active { background: #1565c0; color: #fff; border-color: #1565c0; }
body.dark-mode .snip-panel { background: #1e2022; }
body.dark-mode .snip-card { background: #2a2c2e; border-color: #444; }
body.dark-mode .snip-card-name { color: #ddd; }
body.dark-mode .snip-card-desc { color: #999; }
```

---

## 四、HTML 修改

### 工具栏加按钮（紧跟 `btn-ref` 后面）

```html
<button class="btn btn-snip" id="btn-snip">📄 模板</button>
```

### panel 位置（紧跟 `ref-panel` 的 div 后面）

```html
<div class="snip-panel hidden" id="snip-panel"></div>
```

---

## 五、JS 修改

### SNIPPET_TEMPLATES 数据（加在 `SNIPPETS` 或 `GOC_COLORS` 等常量附近）

见第二节内容。

### buildSnipPanel()（加在 buildRefPanel() 附近）

```javascript
function buildSnipPanel() {
  const panel = document.getElementById('snip-panel');
  if (!panel || panel.dataset.built) return;
  panel.dataset.built = '1';
  SNIPPET_TEMPLATES.forEach(tpl => {
    const card = document.createElement('div');
    card.className = 'snip-card';
    card.innerHTML = `<span class="snip-card-name">${escapeHtml(tpl.name)}</span>
      <span class="snip-card-desc">${escapeHtml(tpl.desc)}</span>
      <button class="snip-insert-btn">插入</button>`;
    card.querySelector('.snip-insert-btn').addEventListener('click', () => {
      insertSnippet(tpl.code);
      // close panel after insert
      document.getElementById('snip-panel').classList.add('hidden');
      document.getElementById('btn-snip').classList.remove('active');
    });
    panel.appendChild(card);
  });
}
```

### btn-snip 点击事件（加在 btn-ref 的 click handler 附近）

```javascript
document.getElementById('btn-snip')?.addEventListener('click', () => {
  buildSnipPanel();
  const panel = document.getElementById('snip-panel');
  const btn = document.getElementById('btn-snip');
  panel.classList.toggle('hidden');
  btn.classList.toggle('active');
});
```

---

## 六、验收自检

- [ ] 工具栏有「📄 模板」按钮，点击展开/收起面板
- [ ] 面板显示 8 张模板卡片，各有名称、说明、「插入」按钮
- [ ] 点击「插入」将代码插入编辑器光标处，面板自动关闭
- [ ] 暗色模式下面板样式正确
- [ ] `docs/实现记录.md` 已更新
