# 089 - 最多边的多边形（2020南海区比赛）

**来源**：https://noi.hnai.net/problem/294.html（椰程信奥，2020年南海区小学乙组比赛 P294）

## 题目描述

输入n根木条长度，选出出现次数最多的长度，画对应边数的正多边形。

## 要求

- 桶排序统计各长度出现次数
- 找出最多次数对应的长度
- 画正maxN边形：`fd(maxM).rt(360.0/maxN)`

## 难度

高级

## 标签

`cin输入` `数组` `桶排序` `正多边形` `算法`

## 参考答案

```cpp
int arr[205];
int main() {
    int n, l, maxN = 0, maxM = 0;
    cin >> n;
    while (n--) {
        cin >> l;
        arr[l]++;
    }
    for (int i = 1; i <= 200; i++) {
        if (arr[i] > maxN) {
            maxN = arr[i];
            maxM = i;
        }
    }
    for (int i = 0; i < maxN; i++) {
        p.fd(maxM).rt(360.0 / maxN);
    }
    return 0;
}
```

> ✅ 绘图部分为纯标准 GOC 命令。算法部分用 cin 和数组。
