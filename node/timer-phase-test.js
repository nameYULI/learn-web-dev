console.log('Start');

// 在脚本开始时注册的定时器
setTimeout(() => {
  console.log('Timer 1 (0ms)');
  process.nextTick(() => console.log('nextTick after Timer 1'));
}, 0);

setTimeout(() => {
  console.log('Timer 2 (0ms)');
  process.nextTick(() => console.log('nextTick after Timer 2'));
}, 0);

setTimeout(() => {
  console.log('Timer 3 (5ms)');
  // 在 timer 回调中注册的新 timer
  setTimeout(() => {
    console.log('Timer 4 (nested, 0ms) - 下一轮');
  }, 0);
}, 5);

// 使用 setImmediate 对比
setImmediate(() => {
  console.log('Immediate 1');
});

console.log('End of script');