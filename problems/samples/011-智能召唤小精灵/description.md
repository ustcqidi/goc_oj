# 011 - 智能召唤小精灵

**来源**：https://noi.hnai.net/problem/276.html（椰程信奥，下册第2课 P276）

## 题目描述

键盘输入日期 day，15号及之前显示兔子图片，15号之后显示熊猫图片。考察 if 条件分支与图片显示。

## 要求

- 读入整数 day
- if(day <= 15) 显示 rabbit2.png
- if(day > 15) 显示 panda.png

## 期望输出

见 `output.png`（根据输入显示不同角色）

## 难度

入门

## 标签

`条件` `输入输出` `扩展命令`

## 参考答案

```cpp
int main(){
    p.picL( 1,"home.png").pic(1) ;
    p.picL( 2,"rabbit2.png");
    p.picL( 3,"panda.png");
    int day;
    cin >> day;
    if(day <= 15) p.pic(2);
    if(day > 15) p.pic(3);
    return 0;
}
```

> ⚠️ 使用 GOC 扩展命令 + cin，OJ 不支持，仅作参考样例。
