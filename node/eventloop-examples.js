// Node.js 事件循环示例集合

console.log('=== 示例1: 基本的微任务和宏任务执行顺序 ===');

// 同步代码
console.log('1: 同步代码开始');

// 宏任务
setTimeout(() => {
  console.log('2: setTimeout 宏任务');
}, 0);

// 微任务 - process.nextTick (最高优先级)
process.nextTick(() => {
  console.log('3: process.nextTick 微任务');
});

// 微任务 - Promise
Promise.resolve().then(() => {
  console.log('4: Promise.then 微任务');
});

// setImmediate (Check阶段)
setImmediate(() => {
  console.log('5: setImmediate');
});

console.log('6: 同步代码结束');

// 预期输出顺序:
// 1: 同步代码开始
// 6: 同步代码结束
// 3: process.nextTick 微任务
// 4: Promise.then 微任务
// 2: setTimeout 宏任务
// 5: setImmediate

console.log('\n=== 示例2: 嵌套的微任务和宏任务 ===');

setTimeout(() => {
  console.log('Timer 1');

  process.nextTick(() => {
    console.log('Timer 1 - nextTick');
  });

  Promise.resolve().then(() => {
    console.log('Timer 1 - Promise');
  });
}, 0);

setTimeout(() => {
  console.log('Timer 2');

  process.nextTick(() => {
    console.log('Timer 2 - nextTick');
  });

  Promise.resolve().then(() => {
    console.log('Timer 2 - Promise');
  });
}, 0);

// Node.js v11+ 版本输出:
// Timer 1
// Timer 1 - nextTick
// Timer 1 - Promise
// Timer 2
// Timer 2 - nextTick
// Timer 2 - Promise

console.log('\n=== 示例3: setTimeout vs setImmediate ===');

// 在主模块中，执行顺序不确定
setTimeout(() => {
  console.log('setTimeout in main');
}, 0);

setImmediate(() => {
  console.log('setImmediate in main');
});

// 但在I/O回调中，setImmediate总是先执行
const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log('setTimeout in I/O callback');
  }, 0);

  setImmediate(() => {
    console.log('setImmediate in I/O callback');
  });
});

console.log('\n=== 示例4: process.nextTick 的饥饿问题 ===');

let count = 0;

function recursiveNextTick() {
  count++;
  if (count < 5) {
    // 限制递归次数避免无限循环
    console.log(`nextTick ${count}`);
    process.nextTick(recursiveNextTick);
  }
}

setTimeout(() => {
  console.log('这个 setTimeout 会被延迟执行');
}, 0);

recursiveNextTick();

console.log('\n=== 示例5: 微任务队列的执行顺序 ===');

// nextTick 总是比 Promise 微任务优先级高
process.nextTick(() => {
  console.log('nextTick 1');

  process.nextTick(() => {
    console.log('nextTick 2');
  });

  Promise.resolve().then(() => {
    console.log('Promise in nextTick');
  });
});

Promise.resolve().then(() => {
  console.log('Promise 1');

  process.nextTick(() => {
    console.log('nextTick in Promise');
  });

  Promise.resolve().then(() => {
    console.log('Promise 2');
  });
});

// 输出顺序:
// nextTick 1
// nextTick 2
// nextTick in Promise
// Promise in nextTick
// Promise 1
// Promise 2
