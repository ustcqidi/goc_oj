# 015 - 批量分辨糖果

**来源**：https://noi.hnai.net/problem/282.html（椰程信奥，下册第3课 P282）

## 题目描述

输入N颗糖果的甜度值，统计甜度小于10的数量A，然后在圆周上均匀放置A个糖果图案（等分圆放射）。

核心逻辑：先循环统计计数，再循环绘图——双循环配合计数变量。

## 要求

- 读入 N，循环N次读甜度，统计 candy<10 的数量 A
- 循环A次，fd(50).pic(2).bk(50).rt(360/A)，均匀放置在圆周

## 期望输出

见 `output.png`（A个糖果均匀排列在圆周上）

## 难度

进阶

## 标签

`循环` `条件` `计数` `等分圆` `输入输出` `扩展命令`

## 参考答案

```cpp
int main()
{
     int candy, A=0, N;
     cin >> N;
     for(int i=0; i<N; i++){
         cin >> candy;
         if(candy < 10) A = A + 1;
     }
     pen.up().bk(50);
     for(int i=0; i<A; i++)
         pen.fd(50).bk(50).rt(360.0/A);
     return 0;
}
```

标准GOC等价（不依赖A为输入，改为固定计数画圆点）：
```cpp
// 固定 A=5，用 oo 画圆点代替图片
int A = 5;
pen.up().bk(80);
for(int i=0; i<A; i++){
    pen.fd(80).oo(12).bk(80).rt(360.0/A);
}
```

> ⚠️ 原题使用 picL/pic + cin，OJ 不支持。标准等价版可在 OJ 中运行。
