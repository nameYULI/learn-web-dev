setTimeout(() => {
  console.log('setTimeout 100');
  setTimeout(() => {
    console.log('setTimeout 100 - 0');
    process.nextTick(() => {
      console.log('nextTick in setTimeout 100 - 0');
    });
  }, 0);
  setImmediate(() => {
    console.log('setImmediate in setTimeout 100');
    process.nextTick(() => {
      console.log('nextTick in setImmediate in setTimeout 100');
    });
  });
  process.nextTick(() => {
    console.log('nextTick in setTimeout100');
  });
  Promise.resolve().then(() => {
    console.log('promise in setTimeout100');
  });
}, 100);
const fs = require('fs');
fs.readFile('./1.poll.js', () => {
  console.log('poll 1');
  process.nextTick(() => {
    console.log('nextTick in poll ======');
  });
});
setTimeout(() => {
  console.log('setTimeout 0');
  process.nextTick(() => {
    console.log('nextTick in setTimeout');
  });
}, 0);
setTimeout(() => {
  console.log('setTimeout 1');
  Promise.resolve().then(() => {
    console.log('promise in setTimeout1');
  });
  process.nextTick(() => {
    console.log('nextTick in setTimeout1');
  });
}, 1);
setImmediate(() => {
  console.log('setImmediate');
  process.nextTick(() => {
    console.log('nextTick in setImmediate');
  });
});
process.nextTick(() => {
  console.log('nextTick 1');
  process.nextTick(() => {
    console.log('nextTick 2');
  });
});
console.log('global ------');
Promise.resolve().then(() => {
  console.log('promise 1');
  process.nextTick(() => {
    console.log('nextTick in promise');
  });
});
