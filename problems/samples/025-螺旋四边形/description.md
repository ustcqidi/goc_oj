# 025 - 螺旋四边形（参数化初始值）

**来源**：https://noi.hnai.net/problem/289.html（椰程信奥，下册第5课 P289）

## 题目描述

根据输入的开始长度 a，以步长5画螺旋四边形。`for(int i=a; i<100; i=i+5)` 每次前进 i 步后右转90°。

## 要求

- 读入整数 a（初始边长）
- for 循环：起始 i=a，步长固定5，终止 i<100
- 每次 fd(i).rt(90)，颜色3（绿色）

## 期望输出

见 `output.png`（绿色螺旋四边形，起始边长可变）

## 难度

进阶

## 标签

`循环` `螺旋图案` `变量计算` `步长`

## 参考答案

```cpp
int main()
{
  pen.c(3);
  int a;
  cin >> a;
  for(int i = a; i < 100; i = i + 5){
      pen.fd(i).rt(90);
  }
  return 0;
}
```

标准OJ等价（固定 a=10）：
```cpp
pen.c(3);
for(int i = 10; i < 100; i = i + 5){
    pen.fd(i).rt(90);
}
```

> ✅ 纯标准 GOC 命令（去掉cin后完全兼容OJ）。
