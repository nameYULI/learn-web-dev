# 如何区分 Promise 和数据请求回调

## 🎯 核心区别

| 特征 | **Promise (.then/await)** | **数据请求回调** |
|-----|--------------------------|----------------|
| **执行阶段** | 微任务队列 | Poll 阶段 |
| **执行时机** | 当前阶段结束后立即 | I/O 操作完成后 |
| **需要等待** | 不需要（已经 resolved） | 需要等待 I/O 完成 |
| **本质** | JavaScript 内部调度 | 系统级 I/O 操作 |

## 🔍 如何识别

### 1. **纯 Promise - 微任务**
```javascript
// ✅ 这些是纯 Promise，在微任务队列执行
Promise.resolve()
Promise.reject()
Promise.all([...])
Promise.race([...])

// 立即 resolved 的 Promise
Promise.resolve().then(() => {
    // 微任务队列
});

// async 函数返回的 Promise
async function foo() {
    return 'value'; // 返回 resolved Promise
}
foo().then(val => {
    // 微任务队列
});
```

### 2. **数据请求 - Poll 阶段**
```javascript
// ✅ 这些是 I/O 操作，回调在 Poll 阶段执行

// 文件操作
fs.readFile(path, callback)     // Poll 阶段
fs.writeFile(path, callback)    // Poll 阶段

// 网络请求
http.get(url, callback)          // Poll 阶段
https.request(options, callback) // Poll 阶段

// 数据库操作
db.query(sql, callback)          // Poll 阶段
collection.find({}, callback)    // Poll 阶段
```

### 3. **混合情况 - 两者都有**
```javascript
// fetch：I/O + Promise
fetch(url)                       // 发起 I/O 操作
    .then(response => {          // 微任务（但要等 I/O 完成）
        return response.json();  // 返回新 Promise
    })
    .then(data => {              // 微任务
        console.log(data);
    });

// Promise 包装的 I/O
const readFilePromise = util.promisify(fs.readFile);
readFilePromise(path)            // I/O 操作
    .then(data => {              // 微任务（等 I/O 完成后）
        console.log(data);
    });
```

## 📊 执行顺序示例

```javascript
console.log('1. 开始');

// 纯 Promise - 微任务
Promise.resolve().then(() => {
    console.log('3. Promise 微任务');
});

// I/O 操作 - Poll 阶段
fs.readFile('./file.txt', () => {
    console.log('5. 文件读取（Poll阶段）');
    
    // I/O 回调中的 Promise
    Promise.resolve().then(() => {
        console.log('6. I/O中的Promise（微任务）');
    });
});

// 定时器 - Timer 阶段
setTimeout(() => {
    console.log('4. Timer阶段');
}, 0);

process.nextTick(() => {
    console.log('2. nextTick 微任务');
});

console.log('1. 结束');

/* 输出：
1. 开始
1. 结束
2. nextTick 微任务
3. Promise 微任务
4. Timer阶段
5. 文件读取（Poll阶段）
6. I/O中的Promise（微任务）
*/
```

## 🎨 判断流程图

```
遇到异步代码
    ↓
是否涉及外部资源？
    ├─ 否 → 纯 Promise？
    │       ├─ 是 → 微任务队列
    │       └─ 否 → 其他（Timer/Immediate）
    │
    └─ 是 → I/O 操作
            ├─ 文件系统 → Poll 阶段
            ├─ 网络请求 → Poll 阶段
            ├─ 数据库 → Poll 阶段
            └─ 返回 Promise？
                ├─ 是 → Poll + 微任务
                └─ 否 → 仅 Poll 阶段
```

## 💡 实用技巧

### 快速判断方法：

1. **看操作内容**
   - 操作 JavaScript 值 → Promise（微任务）
   - 操作外部资源 → I/O（Poll 阶段）

2. **看是否需要等待**
   - 立即可以决定结果 → Promise（微任务）
   - 需要等待系统响应 → I/O（Poll 阶段）

3. **看 API 来源**
   - JavaScript 原生 Promise API → 微任务
   - Node.js 模块（fs, http, net）→ Poll 阶段

### 特殊案例：

```javascript
// async/await 中的 I/O
async function getData() {
    // 1. 同步执行到 await
    console.log('同步部分');
    
    // 2. fetch 发起 I/O（Poll阶段处理响应）
    const res = await fetch(url);
    
    // 3. await 后的代码在微任务队列
    console.log('微任务部分');
    
    // 4. json() 返回 Promise（微任务）
    const data = await res.json();
    
    return data;
}
```

## 📝 总结口诀

**Promise 看结果**：
- 结果已知 → 微任务
- 结果未知要等待 → 先 I/O 后微任务

**回调看来源**：
- JS 引擎调度 → 微任务
- 系统 I/O 返回 → Poll 阶段

**混合看步骤**：
1. I/O 请求发出
2. Poll 阶段收到响应
3. Promise 解析在微任务