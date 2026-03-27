# 024 - 螺旋四边形2（参数化初始值与步长）

**来源**：https://noi.hnai.net/problem/290.html（椰程信奥，下册第5课 P290）

## 题目描述

根据输入的开始长度 a 和步长 b，画螺旋四边形。`for(int i=a; i<100; i=i+b)` 每次前进 i 步后右转90°。

## 要求

- 读入两个整数：开始边长 a 和步长 b
- for 循环：起始 i=a，步长 b，终止 i<100
- 每次 fd(i).rt(90)，颜色14（橙色）

## 期望输出

见 `output.png`（参数化螺旋四边形，形状随a/b变化）

## 难度

进阶

## 标签

`循环` `螺旋图案` `变量计算` `步长`

## 参考答案

```cpp
int main()
{
  pen.c(14);
  int a, b;
  cin >> a >> b;
  for(int i = a; i < 100; i = i + b){
      pen.fd(i).rt(90);
  }
  return 0;
}
```

标准OJ等价（固定 a=10, b=8）：
```cpp
pen.c(14);
for(int i = 10; i < 100; i = i + 8){
    pen.fd(i).rt(90);
}
```

> ✅ 纯标准 GOC 命令（去掉cin后完全兼容OJ）。
