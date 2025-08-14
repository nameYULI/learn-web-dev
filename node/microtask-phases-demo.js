const fs = require('fs');

console.log('=== 同步代码开始 ===');

// Timer 阶段
setTimeout(() => {
  console.log('1. Timer 阶段');

  process.nextTick(() => {
    console.log('2. Timer后的nextTick');
  });

  Promise.resolve().then(() => {
    console.log('3. Timer后的Promise');
  });
}, 0);

// Poll 阶段
fs.readFile(__filename, () => {
  console.log('4. Poll 阶段 - 文件读取');

  process.nextTick(() => {
    console.log('5. Poll后的nextTick');
  });

  Promise.resolve().then(() => {
    console.log('6. Poll后的Promise');
  });
});

// Check 阶段
setImmediate(() => {
  console.log('7. Check 阶段');

  process.nextTick(() => {
    console.log('8. Check后的nextTick');
  });

  Promise.resolve().then(() => {
    console.log('9. Check后的Promise');
  });
});

// 主脚本的微任务
process.nextTick(() => {
  console.log('10. 主脚本的nextTick');
});

Promise.resolve().then(() => {
  console.log('11. 主脚本的Promise');
});

console.log('=== 同步代码结束 ===');
