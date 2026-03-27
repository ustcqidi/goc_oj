# 088 - 包装箱（2020南海区比赛）

**来源**：https://noi.hnai.net/problem/294.html（椰程信奥，2020年南海区小学乙组比赛 P294）

## 题目描述

5个圆形物品自下向上整齐堆放，用一个恰好能包住它们的矩形框。输入5个圆的半径，画出示意图。

## 要求

- `cinWin()` 读入窗口模式
- 循环读5个半径，累加高度，记最大宽度
- 用 `moveTo/r` 画外框

## 难度

高级

## 标签

`cinWin` `moveTo` `r命令` `矩形` `算法` `扩展命令`

## 参考答案

```cpp
int main() {
    int r, n = 5, maxW = 0, H = 0;
    cinWin();
    p.up();
    while (n--) {
        cin >> r;
        H += r * 2;
        if (maxW < 2 * r) maxW = 2 * r;
        p.fd(r).o(r).fd(r);
    }
    p.bk(H / 2).down().r(maxW, H);
    return 0;
}
```

> ⚠️ `cinWin()` 和 `p.r()` 是扩展命令，标准 OJ 不支持。
