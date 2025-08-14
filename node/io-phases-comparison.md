# Pending Callbacks vs Poll 阶段 I/O 回调对比

## 核心区别

| 特征 | **Poll 阶段** | **Pending Callbacks 阶段** |
|-----|--------------|---------------------------|
| **处理内容** | 几乎所有 I/O 回调 | 系统错误 + 延迟的 I/O 回调 |
| **回调类型** | 正常的 I/O 操作 | TCP 错误、被延迟的回调 |
| **执行频率** | 每轮都执行，主要阶段 | 较少执行，特殊情况 |
| **典型场景** | 文件读写、网络请求、数据库查询 | ECONNREFUSED、EPIPE 等错误 |

## 详细说明

### 📊 Poll 阶段（主要 I/O 处理）
```javascript
// ✅ 这些都在 Poll 阶段执行
fs.readFile()           // 文件读取
fs.writeFile()          // 文件写入  
http.request()          // HTTP 请求
database.query()        // 数据库查询
server.on('connection') // 服务器连接
dns.lookup()           // DNS 查询
```

### ⚠️ Pending Callbacks 阶段（特殊情况）
```javascript
// ❌ 这些在 Pending Callbacks 阶段执行
TCP 连接错误 (ECONNREFUSED)
TCP 管道错误 (EPIPE)
某些系统级错误回调
上一轮 poll 阶段未处理完的回调
```

## 为什么要分开？

### 1. **性能优化**
```
Poll 阶段可能有大量 I/O 回调
如果全部处理，可能阻塞事件循环
部分回调延迟到 pending callbacks，保证循环流畅
```

### 2. **错误隔离**
```
系统错误需要特殊处理
与正常 I/O 分开，便于错误管理
避免错误回调影响正常流程
```

### 3. **优先级管理**
```
Pending Callbacks 优先级较高（第二阶段）
确保错误和延迟的回调尽快处理
不会被新的 I/O 事件阻塞
```

## 实际案例

### 场景 1：正常文件操作
```javascript
fs.readFile('data.txt', (err, data) => {
    // ✅ 在 Poll 阶段执行
    console.log('文件内容:', data);
});
```

### 场景 2：TCP 连接错误
```javascript
const client = net.connect(99999); // 无效端口
client.on('error', (err) => {
    // ❌ 在 Pending Callbacks 阶段执行
    console.log('连接失败:', err.code);
});
```

### 场景 3：大量 I/O 导致延迟
```javascript
// 同时发起 1000 个文件读取
for (let i = 0; i < 1000; i++) {
    fs.readFile(`file${i}.txt`, (err, data) => {
        // 前面的在 Poll 阶段
        // 后面的可能延迟到 Pending Callbacks
    });
}
```

## 🎯 记忆技巧

**Poll = Pull（拉取）**
- 主动拉取新的 I/O 事件
- 处理大部分正常回调
- 是 I/O 的主战场

**Pending = 待处理**
- 处理"遗留问题"
- 错误和异常情况
- 上轮没处理完的

## 执行顺序示例

```
事件循环：
1. Timers
2. Pending Callbacks ← 处理错误/延迟回调
3. Idle, Prepare
4. Poll ← 处理新的 I/O 事件
5. Check
6. Close Callbacks
```

简单来说：
- **Poll 阶段** = 食堂正常供餐（处理正常 I/O）
- **Pending Callbacks** = 处理投诉和补餐（处理错误和延迟的）