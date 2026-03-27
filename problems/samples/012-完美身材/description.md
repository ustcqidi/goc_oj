# 012 - 完美身材

**来源**：https://noi.hnai.net/problem/275.html（椰程信奥，下册第2课 P275）

## 题目描述

键盘输入熊猫的宽度k，高度设置为宽度的2倍（h = 2*k），画出对应图形。考察变量计算与图片参数。

## 要求

- 读入整数 k（宽度）
- 高度 = 2 * k
- 以宽k、高2k显示 panda2.png

## 期望输出

见 `output.png`（背景 home.png 上显示宽高比1:2的熊猫）

## 难度

入门

## 标签

`变量计算` `输入输出` `扩展命令`

## 参考答案

```cpp
int main(){
    p.picL( 1,"home.png").pic(1) ;
    p.picL( 2,"panda2.png");
    int k;
    cin >> k;
    p.pic(2,k,2*k);
    return 0;
}
```

> ⚠️ 使用 GOC 扩展命令 + cin，OJ 不支持，仅作参考样例。
