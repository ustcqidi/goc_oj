# 016 - 分辨糖果

**来源**：https://noi.hnai.net/problem/281.html（椰程信奥，下册第3课 P281）

## 题目描述

输入糖果甜度 candy，如果 candy<10 则 A=1，再判断 if(A>0) 画糖果图案。是最简单的「计数变量 + 条件绘图」模式。

## 要求

- 读入 candy
- if(candy < 10) A = A + 1
- if(A > 0) 显示糖果

## 期望输出

见 `output.png`（满足条件则显示糖果，否则空白）

## 难度

入门

## 标签

`条件` `计数` `输入输出` `扩展命令`

## 参考答案

```cpp
int main(){
     int candy, A=0;
     cin >> candy;
     if(candy < 10) A = A + 1;
     if(A > 0)
       pen.bk(100).oo(20);
     return 0;
}
```

> ⚠️ 原题使用 picL/pic + cin，OJ 不支持，仅作参考样例。
