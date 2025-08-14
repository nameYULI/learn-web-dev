console.log('=== 开始注册多个定时器 ===');

// 注册多个延迟为0的定时器
setTimeout(() => {
  console.log('Timer 1');
  process.nextTick(() => {
    console.log('nextTick in Timer 1');
  });
  Promise.resolve().then(() => {
    console.log('Promise in Timer 1');
  });
}, 0);

setTimeout(() => {
  console.log('Timer 2');
  process.nextTick(() => {
    console.log('nextTick in Timer 2');
  });
  Promise.resolve().then(() => {
    console.log('Promise in Timer 2');
  });
}, 0);

setTimeout(() => {
  console.log('Timer 3');
  process.nextTick(() => {
    console.log('nextTick in Timer 3');
  });
  Promise.resolve().then(() => {
    console.log('Promise in Timer 3');
  });
}, 0);

setImmediate(() => {
  console.log('setImmediate 1');
});

setImmediate(() => {
  console.log('setImmediate 2');
});

console.log('=== 同步代码结束 ===');
