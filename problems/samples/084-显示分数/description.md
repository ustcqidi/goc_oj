# 084 - 显示分数高低（魔法学院第14课）

**来源**：https://noi.hnai.net/problem/318.html（椰程信奥，魔法学院第14课 P318）

## 题目描述

输入n个分数，分数<60用1号红色矩形，>=60用10号青色矩形，宽20，高等于分数值。

输入：第一行n；第二行n个分数

## 要求

- 读入分数 s，`if(s<60) a=1; else a=10;`
- 前进 `s/2` 步（到矩形中心），`pen.rr(20, s, a)` 画矩形
- 后退 `s/2`，移位到下一列

## 难度

进阶

## 标签

`cin输入` `if/else` `rr命令` `颜色` `条件图形` `柱状图`

## 参考答案

```cpp
int main() {
    int n, s, a;
    cin >> n;
    p.up().hide();
    for (int i = 0; i < n; i++) {
        cin >> s;
        if (s < 60) a = 1;
        else a = 10;
        pen.fd(s / 2).rr(20, s, a);
        pen.bk(s / 2).rt(90).fd(30).lt(90);
    }
    return 0;
}
```

> ⚠️ `pen.rr()` 是扩展命令；含 cin 输入和 if/else。
