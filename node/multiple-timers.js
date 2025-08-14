// 情况1：多个定时器设置相同延迟
setTimeout(() => console.log('timer 1'), 100);
setTimeout(() => console.log('timer 2'), 100);
setTimeout(() => console.log('timer 3'), 100);

// 情况2：不同延迟但同时到期
setTimeout(() => console.log('timer A - 50ms'), 50);
setTimeout(() => console.log('timer B - 60ms'), 60);
setTimeout(() => console.log('timer C - 55ms'), 55);

// 模拟阻塞，让多个定时器都过期
setTimeout(() => {
  console.log('blocking start');
  const start = Date.now();
  while (Date.now() - start < 200) {
    // 阻塞 200ms
  }
  console.log('blocking end');
}, 10);

// 这些定时器会在阻塞结束后的同一个 timer 阶段执行
setTimeout(() => console.log('timer D - 20ms'), 20);
setTimeout(() => console.log('timer E - 30ms'), 30);
setTimeout(() => console.log('timer F - 40ms'), 40);