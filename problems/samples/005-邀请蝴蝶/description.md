# 005 - 邀请蝴蝶

**来源**：https://noi.hnai.net/problem/272.html（椰程信奥，下册第1课 P272）

## 题目描述

画出下面图形，参数见程序填空。蝴蝶均匀分布在圆形路径上：画笔抬起后退150步，然后循环5次，每次前进80步、右转72°、显示蝴蝶图片。

## 要求

- 背景为 garden.png
- 蝴蝶图片 butterfly.png 均匀分布在圆周上，共5只
- 使用 for 循环 + 等分圆角 360/5

## 期望输出

见 `output.png`（5只蝴蝶均匀分布在圆形轨迹上）

## 难度

入门

## 标签

`循环` `等分圆` `角度`

## 参考答案

```cpp
int main(){
    pen.picL( 1,"garden.png").pic(1) ;
    pen.picL( 2,"butterfly.png");// 定"butterfly.png"为编号2号图
    pen.up(); pen.bk(150);
    //===画鲜花 ==-
    for(int i=0;i< 5;i++)
        pen.fd(80).rt(360.0/5).pic(2);//显示3号图片
    return 0;
}
```

> ⚠️ **注意**：此题使用 GOC 扩展命令 `pen.picL` / `pen.pic`，当前 OJ 执行器不支持，仅作参考样例保存。
