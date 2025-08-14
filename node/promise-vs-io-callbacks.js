/**
 * Promise 微任务 vs 数据请求 I/O 回调的区别
 */

const fs = require('fs');
const https = require('https');

console.log('=== Promise vs 数据请求回调 ===\n');

// ========== 1. 纯 Promise（微任务） ==========
console.log('1. 创建 Promise');

Promise.resolve('直接 resolved')
    .then(value => {
        // ⚡ 微任务队列 - 当前阶段结束后立即执行
        console.log('2. [微任务] Promise.then:', value);
    });

new Promise((resolve) => {
    // 这部分是同步执行的！
    console.log('1.1. Promise 构造函数（同步）');
    resolve('resolved');
}).then(value => {
    // ⚡ 微任务队列
    console.log('2. [微任务] Promise.then:', value);
});

// ========== 2. 数据请求（I/O 回调） ==========
fs.readFile(__filename, (err, data) => {
    // 📊 Poll 阶段 - I/O 操作完成后
    console.log('3. [Poll阶段] 文件读取回调');
    
    // 在 I/O 回调中创建的 Promise
    Promise.resolve().then(() => {
        // ⚡ 微任务 - Poll 阶段后立即执行
        console.log('3.1. [微任务] I/O回调中的Promise');
    });
});

// ========== 3. 混合场景：fetch/async-await ==========
// fetch 返回 Promise，但底层是 I/O 操作

async function fetchData() {
    console.log('4. 开始 fetch（同步部分）');
    
    // fetch 本身返回 Promise
    const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
    // 👆 await 后面的代码相当于 .then() 回调
    
    // 这里实际经历了：
    // 1. 发起网络请求（I/O操作）
    // 2. Poll 阶段：接收响应
    // 3. 微任务：Promise 解析
    
    console.log('5. [组合] fetch 完成（Poll + 微任务）');
    
    const data = await response.json();
    console.log('6. [微任务] 数据解析完成');
}

// ========== 4. 详细对比示例 ==========
function demonstrateDifference() {
    console.log('\n--- 开始对比测试 ---');
    
    // A. 纯 Promise - 微任务
    Promise.resolve().then(() => {
        console.log('A. [微任务] 纯Promise - 最先执行');
    });
    
    // B. 数据请求 - I/O 回调
    fs.readFile('./package.json', () => {
        console.log('B. [Poll阶段] 文件I/O - 需要等待I/O完成');
    });
    
    // C. setTimeout - Timer阶段
    setTimeout(() => {
        console.log('C. [Timer阶段] 定时器');
    }, 0);
    
    // D. setImmediate - Check阶段
    setImmediate(() => {
        console.log('D. [Check阶段] setImmediate');
    });
    
    // E. process.nextTick - 微任务（优先级最高）
    process.nextTick(() => {
        console.log('E. [微任务] nextTick - 优先级最高');
    });
    
    console.log('--- 同步代码结束 ---');
}

// ========== 5. Promise 包装的 I/O 操作 ==========
function promisifiedReadFile(path) {
    return new Promise((resolve, reject) => {
        // fs.readFile 是真正的 I/O 操作
        fs.readFile(path, (err, data) => {
            // 这个回调在 Poll 阶段执行
            console.log('[Poll阶段] 文件读取完成');
            
            if (err) reject(err);
            else resolve(data); // resolve 会将结果传给 .then()
        });
    });
}

// 使用 Promise 包装的 I/O
promisifiedReadFile(__filename)
    .then(data => {
        // 这个 .then() 在 Poll 阶段后的微任务队列执行
        console.log('[微任务] Promise.then 处理数据');
    });

// ========== 执行顺序总结 ==========
demonstrateDifference();

/**
 * 关键区别：
 * 
 * 1. Promise.then() / async-await
 *    - 在微任务队列中执行
 *    - 当前阶段结束后立即执行
 *    - 不需要等待外部操作
 * 
 * 2. 数据请求回调（fs.readFile, http.get等）
 *    - 在 Poll 阶段执行
 *    - 需要等待实际 I/O 操作完成
 *    - 是真正的异步 I/O
 * 
 * 3. 组合情况（fetch, Promise化的I/O）
 *    - I/O 操作在 Poll 阶段完成
 *    - Promise.then 在微任务队列执行
 *    - 两者结合使用
 */

/* 预期输出顺序：
1. 所有同步代码
2. process.nextTick（微任务）
3. Promise.then（微任务）
4. setTimeout（Timer阶段）
5. I/O 回调（Poll阶段）- 取决于I/O完成时间
6. setImmediate（Check阶段）
*/