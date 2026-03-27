# 004 - 放飞气球

**来源**：https://noi.hnai.net/problem/273.html（椰程信奥，下册第1课 P273）

## 题目描述

画出下面图形，参数见程序填空。气球从中心向四周飞散：画笔先抬起，左转60°，然后循环4次，每次前进350步、显示气球图片、后退350步、右转40°。

## 要求

- 画出4个气球均匀分布在圆形路径上的图案
- 背景为 garden.png，气球图片为 balloon.png
- 每次前进后显示气球图片

## 期望输出

见 `output.png`（4个气球沿放射状分布在背景图上）

## 难度

入门

## 标签

`循环` `抬笔落笔` `放射线`

## 参考答案

```cpp
int main(){
    pen.picL( 1,"garden.png").pic(1) ;
    pen.picL( 2,"balloon.png");// 气球
    pen.picU(0);

    pen.up();
    pen.lt(60);
    //===画图案 ===
    for(int i=0;i< 4;i++)
        pen.fd(350).pic(2).bk(350).rt(120.0/3);
    return 0;
}
```

> ⚠️ **注意**：此题使用 GOC 扩展命令 `pen.picL` / `pen.pic` / `pen.picU`，当前 OJ 执行器不支持，仅作参考样例保存。
