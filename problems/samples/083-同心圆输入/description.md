# 083 - 同心圆（输入版，魔法学院第14课）

**来源**：https://noi.hnai.net/problem/318.html（椰程信奥，魔法学院第14课 P318）

## 题目描述

输入n个圆的半径，画n个红色同心圆，并在每个圆上方用text()显示半径值。

输入：第一行n；第二行n个半径值

## 要求

- `cin >> n`，循环读 r
- `pen.o(r, 1)` 画圆轮廓（红色）
- `pen.fd(r+10); pen.text(r); pen.bk(r+10)` 显示数字

## 难度

进阶

## 标签

`cin输入` `圆` `text命令` `颜色` `参数化`

## 参考答案

```cpp
int main() {
    int n, r;
    cin >> n;
    p.up().hide().speed(10);
    for (int i = 0; i < n; i++) {
        cin >> r;
        pen.o(r, 1);
        pen.fd(r + 10);
        pen.text(r);
        pen.bk(r + 10);
    }
    return 0;
}
```

> ⚠️ `pen.text()` 可能是扩展命令；含 cin 输入。
