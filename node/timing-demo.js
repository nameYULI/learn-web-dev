const fs = require('fs');

console.log('=== 开始时间:', new Date().toISOString());

const start = Date.now();

setTimeout(() => {
  console.log('=== Timer 执行时间:', new Date().toISOString());
  console.log('Timer 延迟:', Date.now() - start, 'ms');
}, 0);

fs.readFile(__filename, () => {
  console.log('=== 文件读取完成时间:', new Date().toISOString());
  console.log('文件读取总时间:', Date.now() - start, 'ms');
});

setImmediate(() => {
  console.log('=== setImmediate 执行时间:', new Date().toISOString());
  console.log('setImmediate 延迟:', Date.now() - start, 'ms');
});

console.log('=== 开始阻塞时间:', new Date().toISOString());

// 阻塞2秒
while (Date.now() - start < 2000) {}

console.log('=== 阻塞结束时间:', new Date().toISOString());
console.log('实际阻塞时间:', Date.now() - start, 'ms');
