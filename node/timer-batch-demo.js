console.log('=== 开始 ===');

// 使用较长的阻塞来确保所有定时器都到期
const start = Date.now();

setTimeout(() => {
  console.log('Timer 1 - 延迟5ms');
}, 5);

setTimeout(() => {
  console.log('Timer 2 - 延迟10ms');
}, 10);

setTimeout(() => {
  console.log('Timer 3 - 延迟15ms');
}, 15);

setImmediate(() => {
  console.log('setImmediate - 应该在Timer之前？');
});

// 阻塞50ms，确保所有定时器都到期
while (Date.now() - start < 50) {}

console.log('=== 阻塞结束，定时器都已到期 ===');
