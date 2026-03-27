# GOC 题目数据格式（Schema）

本文档定义单道 GOC 题目的标准数据格式，作为批量出题、OJ 导入和 AI 出题的统一约束。

---

## 一、存储格式选择

**采用 JSON 格式**，每道题一个独立文件，放在 `problems/` 目录下。文件命名规则：

```
编号-题目名.json
示例：001-画正方形.json
```

- 编号：3 位数字，从 001 起连续
- 题目名：简短中文（4～8 字）

---

## 二、字段定义

### 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 与文件编号一致，如 `"001"` |
| `title` | string | 题目标题，如 `"画正方形"` |
| `description` | string | 题目描述（含绘图要求、规律说明、约束条件等），支持 Markdown |
| `difficulty` | string | 难度：`"easy"` / `"medium"` / `"hard"` |
| `tags` | array[string] | 知识点标签，如 `["循环", "正多边形", "角度"]` |
| `starterCode` | string | 起始代码（可为空字符串 `""`，或含注释的框架代码） |
| `solution` | string | 参考答案（完整可运行的 GOC 代码，符合 01 指令规范） |

### 可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `hint` | string | 提示（可不填） |
| `expectedTrajectory` | array | 执行器跑 solution 得到的轨迹数组（格式见 10-执行轨迹规范），OJ 判题用；首次可留空数组 `[]` |
| `constraints` | string | 额外约束（如「必须使用 for 循环」），可选 |

---

## 三、难度取值

| 取值 | 中文 | 对应 06/08 |
|------|------|-----------|
| `"easy"` | 入门 | 入门 |
| `"medium"` | 进阶 | 进阶 |
| `"hard"` | 高级 | 高级 |

---

## 四、完整 JSON 示例

```json
{
  "id": "001",
  "title": "画正方形",
  "description": "用 `for` 循环画一个边长为 100 的红色正方形。\n\n**绘图要求：**\n- 颜色：红色（`pen.c(1)`）\n- 线条粗细：2（`pen.size(2)`）\n- 边长：100\n- 必须使用 `for` 循环完成",
  "difficulty": "easy",
  "tags": ["循环", "正多边形", "角度"],
  "starterCode": "// 在此输入代码\n",
  "solution": "pen.c(1).size(2);\nfor(int i=0; i<4; i++){\n    pen.fd(100).rt(90);\n}",
  "hint": "正方形有 4 条边，每次右转 90°（正方形外角）。",
  "constraints": "必须使用 for 循环",
  "expectedTrajectory": []
}
```

---

## 五、轨迹格式（配合 OJ 使用）

`expectedTrajectory` 是一个对象数组，每个对象代表一条执行指令：

```json
[
  { "cmd": "c",    "args": [1]   },
  { "cmd": "size", "args": [2]   },
  { "cmd": "fd",   "args": [100] },
  { "cmd": "rt",   "args": [90]  },
  { "cmd": "fd",   "args": [100] },
  { "cmd": "rt",   "args": [90]  }
]
```

详细格式定义见 `10-执行轨迹规范.md`。

---

## 六、与其他文档的一致性

| 约定来源 | 关系 |
|----------|------|
| `01-GOC 指令规范.md` | solution / starterCode 只能使用 01 中已定义的指令 |
| `06-GOC 题目案例与模式提炼.md` | difficulty 和 tags 的取值参考 06 中的分析 |
| `08-GOC 题目分类与难度体系.md` | tags 从 08 的标签表中选取 |
| `09-GOC 出题专家规范（出题指南）.md` | description 写法、出题约束遵循 09 |
| `problems/index.json` | 每新增一道题，须同步更新 index |
