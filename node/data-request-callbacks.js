/**
 * 各种数据请求回调的执行阶段
 */

const https = require('https');
const fs = require('fs');
const { MongoClient } = require('mongodb'); // 示例
const mysql = require('mysql2'); // 示例

console.log('=== 数据请求回调执行阶段演示 ===\n');

// 1. HTTP/HTTPS 请求 - Poll 阶段
https.get('https://api.github.com/users/github', (res) => {
    console.log('✅ Poll阶段: HTTP请求回调');
    
    res.on('data', (chunk) => {
        console.log('✅ Poll阶段: 接收数据块');
    });
    
    res.on('end', () => {
        console.log('✅ Poll阶段: 数据接收完成');
    });
});

// 2. 文件读取 - Poll 阶段
fs.readFile('./package.json', 'utf8', (err, data) => {
    if (!err) {
        console.log('✅ Poll阶段: 文件读取回调');
    }
});

// 3. 数据库查询（示例） - Poll 阶段
// MongoDB 查询
async function mongoExample() {
    // 实际连接代码
    // const client = new MongoClient(url);
    // const result = await collection.find({}).toArray();
    
    // 回调在 Poll 阶段执行
    console.log('✅ Poll阶段: MongoDB查询回调');
}

// MySQL 查询
function mysqlExample() {
    // 实际查询代码
    // connection.query('SELECT * FROM users', (err, results) => {
    //     console.log('✅ Poll阶段: MySQL查询回调');
    // });
}

// 4. WebSocket 消息 - Poll 阶段
// ws.on('message', (data) => {
//     console.log('✅ Poll阶段: WebSocket消息回调');
// });

// 5. Redis 操作 - Poll 阶段
// redis.get('key', (err, value) => {
//     console.log('✅ Poll阶段: Redis读取回调');
// });

// ===== 执行时机演示 =====
console.log('1. 同步代码开始');

// 发起 HTTP 请求
https.get('https://jsonplaceholder.typicode.com/posts/1', (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('3. Poll阶段: HTTP响应完成');
        
        // 在 Poll 回调中注册的异步操作
        setImmediate(() => {
            console.log('4. Check阶段: setImmediate（同一轮循环）');
        });
        
        setTimeout(() => {
            console.log('5. Timer阶段: setTimeout（下一轮循环）');
        }, 0);
        
        process.nextTick(() => {
            console.log('3.1. 微任务: nextTick（Poll阶段后立即执行）');
        });
        
        Promise.resolve().then(() => {
            console.log('3.2. 微任务: Promise（Poll阶段后执行）');
        });
    });
});

// 文件操作
fs.readFile(__filename, () => {
    console.log('3. Poll阶段: 文件读取完成');
});

// 对比其他阶段
setTimeout(() => {
    console.log('2. Timer阶段: setTimeout执行');
}, 0);

setImmediate(() => {
    console.log('4. Check阶段: setImmediate执行');
});

process.nextTick(() => {
    console.log('1.1. 微任务: 同步代码后的nextTick');
});

console.log('1. 同步代码结束');

/**
 * 预期输出顺序：
 * 1. 同步代码开始
 * 1. 同步代码结束
 * 1.1. 微任务: 同步代码后的nextTick
 * 2. Timer阶段: setTimeout执行
 * 3. Poll阶段: 文件读取完成 / HTTP响应完成
 * 3.1. 微任务: nextTick（Poll阶段后立即执行）
 * 3.2. 微任务: Promise（Poll阶段后执行）
 * 4. Check阶段: setImmediate执行
 * 5. Timer阶段: setTimeout（下一轮循环）
 */