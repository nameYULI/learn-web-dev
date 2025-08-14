console.log('=== Node.js v11+ 行为测试 ===');

setTimeout(() => {
  console.log('Timer 1');
  process.nextTick(() => {
    console.log('  Timer 1 - nextTick');
  });
}, 0);

setTimeout(() => {
  console.log('Timer 2');
  process.nextTick(() => {
    console.log('  Timer 2 - nextTick');
  });
}, 0);

setTimeout(() => {
  console.log('Timer 3');
  process.nextTick(() => {
    console.log('  Timer 3 - nextTick');
  });
}, 0);
