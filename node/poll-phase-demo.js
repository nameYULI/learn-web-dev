const fs = require('fs');

console.log('开始');

// 阻塞2秒，让所有异步操作都完成
const start = Date.now();
setTimeout(() => {
  console.log('Timer 执行');
}, 0);

fs.readFile(__filename, () => {
  console.log('文件读取完成');
});

setImmediate(() => {
  console.log('setImmediate 执行');
});

// 阻塞2秒
while (Date.now() - start < 2000) {}

console.log('阻塞结束');
