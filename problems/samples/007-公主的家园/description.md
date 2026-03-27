# 007 - 公主的家园

**来源**：https://noi.hnai.net/problem/270.html（椰程信奥，下册第1课 P270）

## 题目描述

调用图片 "garden.png"，显示公主的家园。直接加载并显示一张背景图片，无需循环或转向。

## 要求

- 加载 garden.png 并显示为背景

## 期望输出

见 `output.png`（garden.png 图片在画布中央显示）

## 难度

入门

## 标签

`扩展命令`

## 参考答案

```cpp
int main()
{
    pen.picL( 1,"garden.png");//定义"garden.png"为编号1号图片。
    pen.pic(1);         //显示1号图片pen. pic(1);
    return 0;
}
```

> ⚠️ **注意**：此题使用 GOC 扩展命令 `pen.picL` / `pen.pic`，当前 OJ 执行器不支持，仅作参考样例保存。
