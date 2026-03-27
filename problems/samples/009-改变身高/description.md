# 009 - 改变身高

**来源**：https://noi.hnai.net/problem/278.html（椰程信奥，下册第2课 P278）

## 题目描述

键盘输入熊猫的身高，画出对应图形。用 `cin` 读入整数 h，将熊猫图片以宽300、高h显示在背景图上。

## 要求

- 读入整数 h（身高）
- 以宽300、高h显示 panda.png

## 期望输出

见 `output.png`（背景 home.png 上显示指定身高的熊猫）

## 难度

入门

## 标签

`输入输出` `扩展命令` `变量`

## 参考答案

```cpp
int main(){
    pen.picL( 1,"home.png").pic(1) ;
    pen.picL( 2,"panda.png");
    int h;
    cin >>  h;
    p.pic(2,300,h);
    return 0;
}
```

> ⚠️ 使用 GOC 扩展命令 `picL`/`pic` 及 `cin`，OJ 执行器不支持，仅作参考样例。
