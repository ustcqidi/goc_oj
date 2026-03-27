# GOC Scripts

## sync-problems.js

### 功能

从 `problems/*.json` 读取所有题目数据，做两件事：

1. **重建 `problems/index.json`**：包含每道题的 id、title、difficulty、tags、file 字段，供外部索引使用。
2. **生成 `oj/data/problems.js`**：包含完整题目数据（含 solution、starterCode 等），作为 OJ 前端的数据源（`window.PROBLEMS_DATA`）。

### 如何运行

在 `goc/` 目录下执行：

```bash
node scripts/sync-problems.js
```

### 何时使用

每次新增、修改或删除 `problems/` 下的题目 JSON 文件后，运行此脚本以保持 OJ 数据同步。

典型场景：
- 新出了一道题，保存到 `problems/016-xxx.json` 后运行同步
- 修改了某道题的描述、答案或提示后运行同步
- 删除了某道题后运行同步（手动删除对应 JSON 文件，再同步）

---

## gen-trajectories.js

### 功能

遍历 `problems/*.json`，对每道题运行其 `solution` 代码，把得到的轨迹数组写回 `expectedTrajectory` 字段。
实现了 B2（预生成轨迹写入 JSON），让判题不依赖运行时 re-run solution。

### 如何运行

在 `goc/` 目录下执行：

```bash
node scripts/gen-trajectories.js            # 只处理 expectedTrajectory 为空的题目
node scripts/gen-trajectories.js --force    # 强制重新生成所有
node scripts/gen-trajectories.js --dry-run  # 只打印结果，不写文件
```

### 注意

- 依赖 `oj/js/goc-executor.js`（已修复为 Node/浏览器双环境兼容）。
- 用到 `cin >>` 的题目（需用户输入）无法预生成，会打印警告并跳过，`expectedTrajectory` 保持 `[]`。
- 生成后记得运行 `node scripts/sync-problems.js` 同步 OJ 数据。
