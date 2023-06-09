### 基本使用

```js
const pro = new Promise((resolve, reject) => {
  // 未决阶段的处理
  // 通过调用resolve函数将Promise推向已决阶段的resolved状态
  // 通过调用reject函数将Promise推向已决阶段的rejected状态
  // resolve和reject均可以传递最多一个参数，表示推向状态的数据
  // 立即执行
});

pro.then(
  (data) => {
    //这是thenable函数，如果当前的Promise已经是resolved状态，该函数会立即执行
    //如果当前是未决阶段，则会加入到作业队列，等待到达resolved状态后执行
    //data为状态数据
  },
  (err) => {
    //这是catchable函数，如果当前的Promise已经是rejected状态，该函数会立即执行
    //如果当前是未决阶段，则会加入到作业队列，等待到达rejected状态后执行
    //err为状态数据
  }
);
```

- 未决阶段的处理函数是同步的 会立即执行
- thenable 和 catchable 函数是异步的
