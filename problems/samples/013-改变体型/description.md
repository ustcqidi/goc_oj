# 013 - 改变体型

**来源**：https://noi.hnai.net/problem/274.html（椰程信奥，下册第2课 P274）

## 题目描述

键盘输入熊猫的宽 w 和高 h，画出对应图形。考察 pic 函数宽高参数的独立控制。

## 要求

- 读入两个整数 w、h（宽度和高度）
- 以宽w、高h显示 panda2.png

## 期望输出

见 `output.png`（背景 home.png 上显示指定宽高的熊猫）

## 难度

入门

## 标签

`变量` `输入输出` `扩展命令`

## 参考答案

```cpp
int main(){
    pen.picL( 1,"home.png").pic(1) ;
    pen.picL( 2,"panda2.png");
    int w,h;
    cin >> w >> h;
    p.pic(2,w,h);
    return 0;
}
```

> ⚠️ 使用 GOC 扩展命令 + cin，OJ 不支持，仅作参考样例。
