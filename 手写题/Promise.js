// 先定义三个常量表示状态
var PENDING = 'pending';
var FULFILLED = 'fulfilled';
var REJECTED = 'rejected';

// 构造函数
function MyPromise(fn) {
  this.status = PENDING; // 初始状态为 pending
  this.value = null; // 初始化 value
  this.reason = null; // 初始化 reason

  // 构造函数里面添加两个数组存储成功和失败的回调
  this.onFulfilledCallbacks = [];
  this.onRejectedCallbacks = [];

  // 存一下 this，以便 resolve 和 reject 里面访问
  var that = this;
  function resolve(value) {
    if (that.status === PENDING) {
      that.status = FULFILLED;
      that.value = value;

      // resolve 里面将所有成功的回调拿出来执行
      that.onFulfilledCallbacks.forEach((callback) => {
        callback(that.value);
      });
    }
  }

  function reject(reason) {
    if (that.status === PENDING) {
      that.status = REJECTED;
      that.reason = reason;

      // reject 里面将所有失败的回调拿出来执行
      that.onRejectedCallbacks.forEach((callback) => {
        callback(that.reason);
      });
    }
  }

  try {
    fn(resolve, reject);
  } catch (error) {
    reject(error);
  }
}

function resolvePromise(promise, x, resolve, reject) {
  // 如果 promise 和 x 指向同一对象，以 TypeError 为拒因拒绝执行 promise
  // 这是为了防止死循环
  if (promise === x) {
    return reject(
      new TypeError('The promise and the return value are the same')
    );
  }

  if (x instanceof MyPromise) {
    // 如果 x 为 Promise，则使用 promise 接受 x 的状态
    // 也就是继续执行 x，如果执行的时候拿到一个 y，还要继续解析 y
    // 这个 if 跟下面判断 then 然后拿到执行其实重复了，可有可无
    x.then((y) => resolvePromise(promise, y, resolve, reject), reject);
  } else if (typeof x === 'object' || typeof x === 'function') {
    // 如果 x 为对象或者函数
    // 如果 x 是 null，应该直接 resolve
    if (x === null) {
      return resolve(x);
    }

    try {
      // x.then 赋值给 then
      var then = x.then;
    } catch (error) {
      // 如果取 x.then 的值时抛出错误 e，则以 e 为拒因拒绝 promise
      return reject(error);
    }

    // 如果 then 是函数
    if (typeof then === 'function') {
      var called = false;
      // 将 x 作为函数的作用域 this 调用
      // 传递两个回调函数作为参数，第一个参数叫做 resolvePromise，第二个参数叫做 rejectPromise
      try {
        then.call(
          x,
          // 如果 resolvePromise 以值 y 为参数被调用，则运行[[Resolve]](promise, y)
          (y) => {
            // 如果 resolvePromise 和 rejectPromise 均被调用
            // 如果被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
            // 实现这条需要前面加一个变量 called
            if (called) return;
            called = true;
            resolvePromise(promise, y, resolve, reject);
          },
          // 如果 rejectPromise 以拒因 r 为参数被调用，则以拒因 r 拒绝 promise
          (r) => {
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } catch (error) {
        // 如果调用 then 方法抛出了异常 e
        // 如果 resolvePromise 或 rejectPromise 已经被调用，则忽略
        if (called) return;
        // 否则以 e 为拒因拒绝 promise
        reject(error);
      }
    } else {
      // 如果 then 不是函数，以 x 为参数执行 promise
      resolve(x);
    }
  } else {
    // 如果 x 不为对象或者函数，以 x 为参数执行 promise
    resolve(x);
  }
}

MyPromise.prototype.then = function (onFulfilled, onRejected) {
  // 如果 onFulfilled 不是函数，给一个默认函数，返回 value
  // 后面返回新 promise 的时候也做了 onFulfilled 的参数检查，这里可以删除，暂时保留是为了跟规范一一对应，看得更直观
  var realOnFulfilled = onFulfilled;
  if (typeof realOnFulfilled !== 'function') {
    realOnFulfilled = function (value) {
      return value;
    };
  }

  // 如果 onRejected 不是函数，返回 reason 的 Error
  // 后面返回新的 promise 的时候也做了 onReject 的参数检查，这里可以删除，暂时保留是为了跟规范一一对应，看得更直观
  var realOnRejected = onRejected;
  if (typeof realOnRejected !== 'function') {
    realOnRejected = function (reason) {
      throw reason;
    };
  }

  // 保存一下 this
  if (this.status === FULFILLED) {
    var promise2 = new MyPromise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (typeof onFulfilled !== 'function') {
            resolve(that.value);
          } else {
            var x = realOnFulfilled(that.value);
            resolvePromise(promise2, x, resolve, reject);
          }
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
    return promise2;
  }
  if (this.status === REJECTED) {
    var promise2 = new MyPromise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (typeof onRejected !== 'function') {
            reject(that.reason);
          } else {
            var x = realOnRejected();
            resolvePromise(promise2, x, resolve, reject);
          }
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
    return promise2;
  }

  // 如果还是 PENDING 状态，将回调保存下来
  if (this.status === PENDING) {
    var promise2 = new MyPromise((resolve, reject) => {
      that.onFulfilledCallbacks.push(() => {
        setTimeout(() => {
          try {
            if (typeof onFulfilled !== 'function') {
              resolve(that.value);
            } else {
              var x = realOnFulfilled(that.value);
              resolvePromise(promise2, x, resolve, reject);
            }
          } catch (error) {
            reject(error);
          }
        }, 0);
      });
      that.onRejectedCallbacks.push(() => {
        setTimeout(() => {
          try {
            if (typeof onRejected !== 'function') {
              reject(that.reason);
            } else {
              var x = onRejected(that.reason);
              resolvePromise(promise2, x, resolve, reject);
            }
          } catch (error) {
            reject(error);
          }
        }, 0);
      });
    });
    return promise2;
  }
};

MyPromise.deferred = function () {
  var result = {};
  result.promise = new MyPromise((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });
  return result;
};

MyPromise.resolve = function (parameter) {
  if (parameter instanceof MyPromise) {
    return parameter;
  }
  return new MyPromise((resolve) => {
    resolve(parameter);
  });
};

MyPromise.reject = function (reason) {
  return new MyPromise((resolve, reject) => {
    reject(reason);
  });
};

MyPromise.all = function (promiseList) {
  var resPromise = new MyPromise((resolve, reject) => {
    var count = 0;
    var result = [];
    var length = promiseList.length;

    if (length === 0) {
      return resolve(result);
    }

    promiseList.forEach((promise, list) => {
      MyPromise.resolve(promise).then(
        (value) => {
          count++;
          result[index] = value;
          if (count === length) {
            resolve(result);
          }
        },
        (reason) => {
          reject(reason);
        }
      );
    });
  });

  return resPromise;
};

MyPromise.race = function (promiseList) {
  var resPromise = new MyPromise((resolve, reject) => {
    var length = promiseList.length;
    if (length === 0) {
      return resolve();
    } else {
      for (var i = 0; i < length; i++) {
        MyPromise.resolve(promiseList[i]).then(
          (value) => {
            return resolve(value);
          },
          (reason) => {
            return reject(reason);
          }
        );
      }
    }
  });

  return resPromise;
};

MyPromise.prototype.catch = function (onRejected) {
  this.then(null, onRejected);
};

MyPromise.prototype.finally = function (fn) {
  return this.then(
    (value) => {
      return MyPromise.resolve(fn()).then(() => value);
    },
    (error) =>
      MyPromise.resolve(fn()).then(() => {
        throw error;
      })
  );
};

MyPromise.allSettled.finally = function (promiseList) {
  return new MyPromise((resolve) => {
    var length = promiseList.length;
    var result = [];
    var count = 0;

    if (length === 0) {
      return resolve(result);
    } else {
      for (var i = 0; i < length; i++) {
        (function (i) {
          var currentPromise = MyPromise.resolve(promiseList[i]);
          currentPromise.then(
            (value) => {
              count++;
              result[i] = {
                status: 'fulfilled',
                value,
              };
              if (count === length) {
                return resolve(result);
              }
            },
            (reason) => {
              count++;
              result[i] = {
                status: 'rejected',
                reason,
              };
              if (count === length) {
                return resolve(result);
              }
            }
          );
        })(i);
      }
    }
  });
};

module.exports = MyPromise;
