# Node.js 事件循环详解

## 什么是事件循环？

事件循环是 Node.js 处理异步操作的核心机制。它允许 Node.js 在单线程环境中执行非阻塞 I/O 操作，通过将操作卸载到系统内核（在可能的情况下）来实现。

## 事件循环的阶段

```
   ┌───────────────────────────┐
┌─>│           timers          │  ← setTimeout, setInterval
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │  ← I/O 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │  ← 内部使用
│  └─────────────┬─────────────┘      ┌───────────────┐
│  ┌─────────────┴─────────────┐      │   incoming:   │
│  │           poll            │<─────┤  connections, │
│  └─────────────┬─────────────┘      │   data, etc.  │
│  ┌─────────────┴─────────────┐      └───────────────┘
│  │           check           │  ← setImmediate
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │  ← close 事件
   └───────────────────────────┘
```

### 1. Timer 阶段
- 执行 `setTimeout()` 和 `setInterval()` 的回调
- 定时器指定的是**最小延迟时间**，而不是确切的执行时间

### 2. Pending Callbacks 阶段
- 执行某些系统操作的回调（如 TCP 错误）
- 执行延迟到下一个循环迭代的 I/O 回调

### 3. Idle, Prepare 阶段
- 仅供内部使用

### 4. Poll 阶段（重要）
- 获取新的 I/O 事件
- 执行与 I/O 相关的回调
- 在适当的时候阻塞在这里

**Poll 阶段的行为：**
- 如果 poll 队列**不为空**：同步执行回调，直到队列清空或达到系统限制
- 如果 poll 队列**为空**：
  - 如果有 `setImmediate()` 回调：结束 poll 阶段，进入 check 阶段
  - 如果没有 `setImmediate()` 回调：等待回调被添加到队列

### 5. Check 阶段
- 执行 `setImmediate()` 回调
- 在 poll 阶段完成后立即执行

### 6. Close Callbacks 阶段
- 执行关闭事件的回调，如 `socket.on('close', ...)`

## 微任务队列

在每个事件循环阶段之间，Node.js 会检查并执行微任务队列：

### 微任务的优先级（从高到低）：
1. **process.nextTick()** - 最高优先级
2. **Promise 相关** - then(), catch(), finally()
3. **queueMicrotask()**

### 关键特性：
- 微任务在每个阶段结束后立即执行
- `process.nextTick()` 比 Promise 微任务优先级更高
- 微任务会在进入下一个事件循环阶段前全部执行完毕

## Node.js 版本差异

### Node.js v10 及之前
- 微任务在事件循环的每个**阶段之间**执行
- 所有 timer 回调在同一阶段连续执行完毕后，才处理微任务

### Node.js v11+
- 微任务在每个**单独的宏任务**执行后立即处理
- 行为更接近浏览器标准

## 常见陷阱

### 1. process.nextTick() 饥饿
```javascript
function recursiveNextTick() {
    process.nextTick(recursiveNextTick);
}
recursiveNextTick(); // 会阻止事件循环进入其他阶段
```

### 2. setTimeout vs setImmediate
在主模块中的执行顺序不确定，但在 I/O 回调中，setImmediate 总是先执行。

### 3. 微任务队列阻塞
过多的微任务会延迟宏任务的执行，影响性能。

## 最佳实践

1. **避免长时间运行的同步操作**
2. **谨慎使用 process.nextTick()**，考虑使用 setImmediate()
3. **理解异步操作的执行顺序**，特别是在不同 Node.js 版本间
4. **监控事件循环延迟**，使用相关工具检测性能问题

## 调试技巧

```javascript
// 检查事件循环延迟
const start = process.hrtime();
setImmediate(() => {
    const delta = process.hrtime(start);
    const nanosec = delta[0] * 1e9 + delta[1];
    const millisec = nanosec / 1e6;
    console.log(`事件循环延迟: ${millisec.toFixed(2)}ms`);
});
```

通过理解这些机制，你可以更好地编写高性能的 Node.js 应用程序，避免常见的陷阱，并优化异步代码的执行效率。