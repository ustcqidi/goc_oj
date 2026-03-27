# 006 - 种植鲜花

**来源**：https://noi.hnai.net/problem/271.html（椰程信奥，下册第1课 P271）

## 题目描述

画出下面图形，参数见程序填空。使用循环，边旋转边显示花朵图片：画笔抬起后退150步，然后循环6次，每次前进80步、右转60°、显示花朵图片。

## 要求

- 背景为 garden.png
- 花朵图片 flower.png 均匀分布在圆周上，共6朵
- 使用 for 循环 + 等分圆角 360/6

## 期望输出

见 `output.png`（6朵花均匀种植在圆形路径上）

## 难度

入门

## 标签

`循环` `等分圆` `角度`

## 参考答案

```cpp
int main(){
    pen.picL( 1,"garden.png").pic(1) ;
    pen.picL( 3,"flower.png");// 定"flower.png"为编号3号图
    pen.up(); pen.bk(150);
    //===画鲜花 ==-
    for(int i=0;i< 6;i++)
        pen.fd(80).rt(360.0/6).pic(3);//显示3号图片
    return 0;
}
```

> ⚠️ **注意**：此题使用 GOC 扩展命令 `pen.picL` / `pen.pic`，当前 OJ 执行器不支持，仅作参考样例保存。
