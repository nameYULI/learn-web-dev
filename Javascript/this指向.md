### this 的四中应用场景

1. 作为对象属性被调用
2. 作为普通函数被调用
3. 作为构造函数
4. call 和 apply 的应用

- 普通函数（非箭头函数）被调用时（运行时）才会确定该函数内的 this 指向 因为在函数中 this 与 arguments 是两个特殊的变量
  在函数被调用时才会取得它们 并且搜索这两个变量时只会在活动对象范围里面去搜索
- 要确定函数中 this 指向 必须先找到该函数被调用的位置

#### `test()` 形式

> 直接不带任何引用形式去调用函数 this 会指向全局对象（浏览器是 window、Node 中是 global） note: 严格模式下 this 是 undefined

```js
var a = 1;
function test() {
  console.log(this.a);
}
test(); // 1
```

```js
var a = 1;
function test() {
  console.log(this.a);
}
var obj = {
  a: 2,
  test,
};
var testCopy = obj.test;
testCopy();
```

> 注意 setTimeout 的本质

```js
function setTimeout(fn, time) {
  // 这里干了一大波不可描述的事情，最后会去调一下你传进来的回调函数
  fn();
}

var a = 1;
function test() {
  console.log(this.a);
}
var obj = {
  a: 2,
  test,
};
setTimeout(obj.test); // 1
```

#### `xxx.test()` 形式

> 谁去调用的这个函数 这个函数中的 this 就绑定到谁身上

```js
var a = 1;
function test() {
  console.log(this.a);
}
var obj = {
  a: 2,
  test,
};
obj.test(); // 2
```

> this 只对直属上司（直接调用者）负责

```js
var a = 1;
function test() {
  console.log(this.a);
}
var obj = {
  a: 2,
  test,
};
var obj0 = {
  a: 3,
  obj,
};
obj0.obj.test(); // 2 只对 obj 负责
```

#### `test.call(xxx)/test.apply(xxx)/test.bind(xxx)` 形式

> apply（数组传参） 跟 call 的区别只是传参 作用是一样的，bind 有点区别 bind 能让我们的函数延迟执行 apply 与 call 调用就执行 所以 bind 这样的形式我们也称为函数柯里化

- 指向参数中的对象 若参数为空 默认指向全局对象

```js
var a = 1;
function test() {
  console.log(this.a);
}
var obj = {
  a: 2,
  test,
};
var testCopy = obj.test;
testCopy.call(obj); // 2
```

#### `new test()` 形式

> new 操作符其实是 new 了一个新对象出来 而被 new 的 test 我们称为构造函数 构造函数里的 this 指向将要被 new 出来的对象

```js
var a = 1;
function test(a) {
  this.a = a;
}
var b = new test(2);
console.log(b.a); // 2
```

#### 箭头函数

箭头函数中的 this 在函数定义的时候就已经确定 它 this 就是它的外层作用域的 this

```js
var a = 1;
var test = () => {
  console.log(this.a);
};
var obj = {
  a: 2,
  test,
};
obj.test(); // 1
```

### this 的值

> 函数调用都可以转为 func.call(context, p1, p2) 来看 如果你传的 context 是 null 或 undefined，那么 window 对象就是默认的 context（严格模式下默认 context 是 undefined）

```js
func(p1, p2);
// 等价于
func.call(undefined, p1, p2); // this

obj.child.method(p1, p2);
// 等价于
obj.child.method.call(obj.child, p1, p2);
```

#### [] 语法

```js
function fn() {
  console.log(this);
}
var arr = [fn, fn2];
arr[0](); // 这里面的 this 又是什么呢？ arr

//        arr[0]()
// 假想为    arr.0()
// 然后转换为 arr.0.call(arr)
// 那么里面的 this 就是 arr 了
```
