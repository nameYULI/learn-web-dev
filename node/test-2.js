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
