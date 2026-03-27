# Claude Code 任务说明：GOC-151 进度备份/恢复（导出·导入）

**目标**：Header 加「💾 备份」和「📂 恢复」两个按钮，将所有练习记录（非偏好设置的 `goc_*` 键）导出为 JSON 文件；导入时读取文件写回 localStorage，刷新界面。

---

## 一、硬性要求

- 只改 `oj/index.html`，不改其他文件。
- 备份范围：所有 `goc_*` 键，排除 PREF_KEYS（`goc_dark_mode`/`goc_fontSize`/`goc_fontFamily`/`goc_sidebar_collapsed`/`goc_last_problem`）。
- 导入需二次确认弹窗防止误操作。

---

## 二、具体修改

### HTML（header 末尾，dark-toggle-btn 之后）

```html
<button class="dark-toggle-btn" id="btn-backup"  title="导出所有练习记录为 JSON 文件">💾 备份</button>
<button class="dark-toggle-btn" id="btn-restore" title="从 JSON 文件恢复练习记录">📂 恢复</button>
<input type="file" id="restore-file-input" accept=".json" style="display:none">
```

### JS（加在 initDarkMode / btn-clear-progress handler 附近，作为独立函数）

```javascript
// GOC-151: Progress backup / restore
const PREF_KEYS = ['goc_dark_mode','goc_fontSize','goc_fontFamily','goc_sidebar_collapsed','goc_last_problem'];

function exportProgress() {
  const data = {};
  Object.keys(localStorage)
    .filter(k => k.startsWith('goc_') && !PREF_KEYS.includes(k))
    .forEach(k => { data[k] = localStorage.getItem(k); });
  const today = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const blob = new Blob([JSON.stringify({ version:1, exportDate: today, data }, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `goc-backup-${today}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const obj = JSON.parse(e.target.result);
      if (!obj.data || typeof obj.data !== 'object') { alert('文件格式无效。'); return; }
      const count = Object.keys(obj.data).length;
      if (!confirm(`将导入 ${count} 条记录，覆盖本机现有进度，继续？`)) return;
      Object.entries(obj.data).forEach(([k, v]) => {
        if (k.startsWith('goc_') && !PREF_KEYS.includes(k)) localStorage.setItem(k, v);
      });
      renderSidebar(currentFilter, currentTag, currentCurriculum);
      updateProgress(); updateDiffCounts(); updateStatusCounts();
      alert(`✅ 已恢复 ${count} 条记录。`);
    } catch { alert('读取文件失败，请确认是有效的备份文件。'); }
  };
  reader.readAsText(file);
}

document.getElementById('btn-backup')?.addEventListener('click', exportProgress);
document.getElementById('btn-restore')?.addEventListener('click', () => {
  document.getElementById('restore-file-input').value = '';
  document.getElementById('restore-file-input').click();
});
document.getElementById('restore-file-input')?.addEventListener('change', e => {
  if (e.target.files[0]) importProgress(e.target.files[0]);
});
```

**注意**：`importProgress` 里的 `PREF_KEYS` 与 `btn-clear-progress` 里的重复定义，可提取为模块级常量，也可直接复用已有的（若已提取）。

---

## 三、验收自检

- [ ] Header 有「💾 备份」「📂 恢复」两个按钮，样式与「🌙 深色」一致
- [ ] 点「💾 备份」弹出文件下载，文件名 `goc-backup-YYYYMMDD.json`，内容为 JSON
- [ ] JSON 包含所有 `goc_*` 键（记录+星标+笔记），不含偏好设置键
- [ ] 点「📂 恢复」弹出文件选择框，选择备份文件后有二次确认，确认后写入 localStorage 并刷新侧栏/进度
- [ ] `docs/实现记录.md` 已更新
