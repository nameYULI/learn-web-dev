console.log('Script start time:', Date.now());

setTimeout(() => {
  const callbackTime = Date.now();
  console.log('Timer 1 executing at:', callbackTime);
  
  // 在 timer 回调中注册新定时器
  const newTimerRegistrationTime = Date.now();
  setTimeout(() => {
    console.log('Nested timer executing at:', Date.now());
    console.log('Was registered at:', newTimerRegistrationTime);
    console.log('Delay between registration and execution:', Date.now() - newTimerRegistrationTime, 'ms');
  }, 0);
  
  console.log('New timer registered at:', newTimerRegistrationTime);
  console.log('But timer phase snapshot was taken before this registration');
}, 10);

// 同时注册的另一个定时器
setTimeout(() => {
  console.log('Timer 2 executing at:', Date.now());
}, 10);

// 添加 setImmediate 来标记事件循环阶段
setImmediate(() => {
  console.log('Check phase - current event loop');
});