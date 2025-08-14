/**
 * Pending Callbacks vs Poll 阶段的 I/O 回调区别
 */

const fs = require('fs');
const net = require('net');

// ===== Poll 阶段的 I/O 回调 =====
// 正常的、成功的 I/O 操作回调

// 1. 文件读取成功
fs.readFile('./test.txt', (err, data) => {
    if (!err) {
        console.log('✅ Poll阶段: 文件读取成功');
    }
});

// 2. 网络请求成功
const server = net.createServer((socket) => {
    console.log('✅ Poll阶段: 新的客户端连接');
});

// 3. DNS 查询成功
const dns = require('dns');
dns.lookup('google.com', (err, address) => {
    if (!err) {
        console.log('✅ Poll阶段: DNS查询成功');
    }
});

// ===== Pending Callbacks 阶段的 I/O 回调 =====
// 系统级错误、延迟处理的回调

// 1. TCP 错误 - ECONNREFUSED, EPIPE 等
const client = net.createConnection({ port: 99999 }, () => {
    console.log('连接到服务器');
});

client.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
        console.log('❌ Pending阶段: TCP连接被拒绝');
    }
});

// 2. 某些被延迟的 I/O 回调
// 当 poll 阶段回调队列过长，某些回调会被延迟到下一轮的 pending callbacks 阶段

// 模拟大量 I/O 操作
for (let i = 0; i < 100; i++) {
    fs.readFile(`./file${i}.txt`, (err, data) => {
        // 如果 poll 阶段处理不完，部分回调可能延迟到 pending callbacks
    });
}

/**
 * 总结：
 * 
 * Poll 阶段：
 * - 处理几乎所有的 I/O 回调
 * - 包括：文件操作、网络操作、数据库查询等
 * - 这是主要的 I/O 处理阶段
 * - 正常的、成功的 I/O 操作
 * 
 * Pending Callbacks 阶段：
 * - 处理系统操作的错误回调（如 TCP 错误）
 * - 处理上一轮循环延迟执行的 I/O 回调
 * - 这个阶段处理的回调较少
 * - 主要是错误和异常情况
 */

// 实际例子：演示两种回调的执行时机
console.log('开始');

// 这会在 poll 阶段执行
fs.readFile(__filename, () => {
    console.log('Poll: 文件读取回调');
    
    // 标记事件循环阶段
    setImmediate(() => console.log('Check: setImmediate'));
    setTimeout(() => console.log('Timer: setTimeout'), 0);
});

// 模拟 TCP 错误（会在 pending callbacks 阶段）
const errorClient = net.createConnection({ port: 1 });
errorClient.on('error', () => {
    console.log('Pending: TCP错误回调');
});

process.nextTick(() => console.log('nextTick'));
console.log('结束');