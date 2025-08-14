# Poll 阶段：数据请求回调的主要处理阶段

## 🎯 核心答案
**所有数据请求的回调都在 Poll 阶段处理**

## 📊 Poll 阶段处理的数据请求类型

### 1. **网络请求**
```javascript
// HTTP/HTTPS 请求
https.get(url, (response) => {
    // ✅ Poll 阶段执行
});

// TCP/UDP 连接
socket.on('data', (data) => {
    // ✅ Poll 阶段执行
});

// WebSocket 消息
ws.on('message', (msg) => {
    // ✅ Poll 阶段执行
});
```

### 2. **文件系统操作**
```javascript
// 文件读取
fs.readFile(path, (err, data) => {
    // ✅ Poll 阶段执行
});

// 文件写入
fs.writeFile(path, data, (err) => {
    // ✅ Poll 阶段执行
});

// 目录操作
fs.readdir(path, (err, files) => {
    // ✅ Poll 阶段执行
});
```

### 3. **数据库操作**
```javascript
// MongoDB 查询
collection.find({}).toArray((err, docs) => {
    // ✅ Poll 阶段执行
});

// MySQL 查询
connection.query('SELECT * FROM users', (err, results) => {
    // ✅ Poll 阶段执行
});

// Redis 操作
redis.get('key', (err, value) => {
    // ✅ Poll 阶段执行
});
```

### 4. **第三方 API 调用**
```javascript
// REST API
fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
        // ✅ Poll 阶段执行（底层是 I/O 操作）
    });

// GraphQL 查询
apolloClient.query({ query: GET_USERS })
    .then(result => {
        // ✅ Poll 阶段执行
    });
```

## 🔄 Poll 阶段的工作流程

```
┌─────────────────────────────────┐
│        进入 Poll 阶段            │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│   检查 Poll 队列是否有事件        │
└────────────┬────────────────────┘
             ↓
        队列有事件？
         ├── 是 ──→ 执行所有回调（有上限）
         │          ↓
         │      清空微任务
         │          ↓
         │      继续下一阶段
         │
         └── 否 ──→ 检查是否有 setImmediate
                    ├── 有 ──→ 进入 Check 阶段
                    └── 无 ──→ 等待新 I/O 事件
                              （阻塞，有超时限制）
```

## ⏱️ Poll 阶段的阻塞行为

Poll 阶段特殊之处在于它可能**阻塞**等待：

1. **没有待处理的 I/O 回调**
2. **没有 setImmediate 回调**
3. **没有即将到期的 timer**

```javascript
// 示例：Poll 阶段阻塞
console.log('开始');

// 5秒后的定时器
setTimeout(() => {
    console.log('5秒定时器');
}, 5000);

// Poll 阶段会阻塞等待，直到：
// 1. 有新的 I/O 事件
// 2. 或 5 秒定时器快到期
```

## 🎨 完整示例：追踪数据请求

```javascript
console.log('=== 追踪数据请求执行阶段 ===');

// 1. 发起请求（同步代码）
console.log('1. 发起 HTTP 请求');
https.get('https://api.example.com/data', (res) => {
    console.log('3. [Poll] HTTP 响应回调');
    
    res.on('data', (chunk) => {
        console.log('3.1. [Poll] 接收数据块');
    });
    
    res.on('end', () => {
        console.log('3.2. [Poll] 数据接收完成');
        
        // 在 Poll 回调中注册的任务
        process.nextTick(() => {
            console.log('3.3. [微任务] Poll 后的 nextTick');
        });
        
        setImmediate(() => {
            console.log('4. [Check] Poll 后的 setImmediate');
        });
    });
});

// 2. 其他异步操作
setTimeout(() => {
    console.log('2. [Timer] setTimeout');
}, 0);

console.log('1. 同步代码结束');

/* 输出顺序：
1. 发起 HTTP 请求
1. 同步代码结束
2. [Timer] setTimeout
3. [Poll] HTTP 响应回调
3.1. [Poll] 接收数据块
3.2. [Poll] 数据接收完成
3.3. [微任务] Poll 后的 nextTick
4. [Check] Poll 后的 setImmediate
*/
```

## 📝 总结

| 问题 | 答案 |
|-----|-----|
| **数据请求回调在哪个阶段？** | Poll 阶段 |
| **为什么在 Poll 阶段？** | Poll 专门处理 I/O 事件 |
| **包括哪些数据请求？** | HTTP、文件、数据库、WebSocket 等 |
| **Poll 阶段的特点？** | 可以阻塞等待新事件 |
| **执行顺序？** | Timer → Pending → Poll → Check |

**记忆口诀：**
- Poll = Pull（拉取）
- 拉取所有 I/O 数据
- 数据请求的回调都在这里处理