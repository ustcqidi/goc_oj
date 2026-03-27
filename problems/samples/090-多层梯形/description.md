# 090 - 多层梯形（2020南海区比赛）

**来源**：https://noi.hnai.net/problem/294.html（椰程信奥，2020年南海区小学乙组比赛 P294）

## 题目描述

输入n块木板长度，过滤长度≤20的木板，剩余木板从下到上堆成多个等腰梯形，总高度300。用 moveTo/lineTo 精确画出每个梯形。

## 难度

高级

## 标签

`cinWin` `moveTo` `lineTo` `算法` `梯形` `扩展命令`

## 参考答案

```cpp
int arr[55];
int main() {
    cinWin();
    int n, cnt = 0, x;
    cin >> n;
    while (n--) {
        cin >> x;
        if (x > 20) { arr[cnt] = x; cnt++; }
    }
    int h = 300.0 / (cnt - 1);
    for (int i = 0; i < cnt - 1; i++) {
        double x1 = arr[i] / 2.0, y1 = h * i;
        double x2 = arr[i + 1] / 2.0, y2 = h * (i + 1);
        p.moveTo(x1, y1).lineTo(-x1, y1).lineTo(-x2, y2).lineTo(x2, y2).lineTo(x1, y1);
    }
    return 0;
}
```

> ⚠️ `cinWin()`, `moveTo()`, `lineTo()` 是扩展命令，标准 OJ 不支持。
