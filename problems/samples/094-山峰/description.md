# 094 - 山峰（mountain，2018NHOI小乙）

**来源**：https://noi.hnai.net/problem/295.html（椰程信奥，2018年南海区小学乙组比赛 P295）

## 题目描述

输入N个高度，画N个矩形（宽20）表示山脉；判断山峰（左右两边都比它矮），用实心矩形标出。

## 要求

- `cinWin()` + 存储数组
- 先画所有矩形 `moveTo(i*20,m/2).r(20,m)`
- 再标记山峰 `moveTo(i*20,m/2).rr(20,m)`

## 难度

高级

## 标签

`cinWin` `数组` `moveTo` `r命令` `rr命令` `条件判断` `算法`

## 参考答案

```cpp
int arr[15];
int main() {
    cinWin();
    int n, m;
    cin >> n;
    for (int i = 1; i <= n; i++) {
        cin >> m;
        p.moveTo(i * 20, m / 2.0).r(20, m);
        arr[i] = m;
    }
    for (int i = 2; i <= n - 1; i++) {
        m = arr[i];
        if (arr[i - 1] < m && m > arr[i + 1])
            p.moveTo(i * 20, m / 2.0).rr(20, m);
    }
    return 0;
}
```

> ⚠️ `cinWin()`, `moveTo()`, `r()`, `rr()` 是扩展命令，标准 OJ 不支持。
