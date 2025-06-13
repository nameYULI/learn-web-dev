### useRef

useRef是一个React Hook 它能帮助引用一个不需要渲染的值

```jsx
const ref = useRef(initialValue)
```

在组件顶层调用useRef以声明一个ref

```jsx
import { useRef } from 'react';

function MyComponent() {
  const intervalRef = useRef(0);
  const inputRef = useRef(null);
  // ...
}
```

参数：

`initialValue`: ref对象的current属性的初始值 可以是任意类型的值 这个参数在首次渲染后被忽略

返回值：

useRef返回一个只有一个属性的对象

`current`: 初始值为传递的initialValue 之后可以将其设置为其他值 如果将ref对象作为一个JSX节点的ref属性传递给React React将为它设置current属性

注意：

1. 可以修改ref.current属性 与state不同 它是可变的 然而如果它持有一个用于渲染的对象（例如state的一部分）那就不应该修改这个对象

2. 改变ref.current属性时 React不会重新渲染组件 React不知道它何时会发生改变 因为ref是一个普通的JavaScript对象

3. 除了初始化外 不要在渲染期间写入或者读取ref.current 否则会使组件行为变得不可预测

4. 在严格模式下 React将会调用两次组件方法 这为了帮助发现意外问题 （只是开发环境的行为 不会影响生产环境）每个ref对象都将会创建两次 但是其中一个版本将被丢弃

#### 使用

##### 用ref引用一个值

在组件顶层调用useRef声明一个或多个ref

```jsx
import { useRef } from 'react';

function Stopwatch() {
  const intervalRef = useRef(0);
  // ..
}
```

useRef返回一个具有单个current属性的ref对象 并初始化为你提供的初始值

在后续的渲染中 useRef将返回相同的对象 你可以改变它的current属性来存储信息 并在之后读取它 这会让人联想到state 但是有一个重要的区别

改变ref不会触发重新渲染 这意味着ref是存储一些不影响组件视图输出信息的完美选择 例如 如果需要存储一个interval ID并在以后检索它 那么可以将它存储在ref中 只需要手动改变它的current属性即可修改ref的值

```jsx
function handleStartClick() {
  const intervalId = setInterval(() => {
    // ...
  }, 1000);
  intervalRef.current = intervalId;
}
```

在之后 从ref中读取interval ID便可以清除定时器

```jsx
function handleStopClick() {
  const intervalId = intervalRef.current;
  clearInterval(intervalId);
}
```

使用ref可以确保：

1. 可以在重新渲染之间存储信息（普通对象存储的值每次渲染都会重置）

2. 改变它不会触发重新渲染（状态变量会触发重新渲染）

3. 对于组件的每个副本而言 这些信息都是本地的（外部变量则是共享的）

改变ref不会触发重新渲染 所以ref不适合用于存储期望显示在屏幕上的信息 如有需要 使用state代替

⚠️注意：

不要在渲染期间写入或者读取ref.current

React期望组件主体表现得像一个纯函数：

1. 如果输入的（props、state与上下文）都是一样的 那么就应该返回一样的JSX

2. 以不同的顺序或用不用的参数调用它 不应该影响其它调用的结果

在渲染期间读取或写入ref会破坏这些预期行为

```jsx
function MyComponent() {
  // ...
  // 🚩 不要在渲染期间写入 ref
  myRef.current = 123;
  // ...
  // 🚩 不要在渲染期间读取 ref
  return <h1>{myOtherRef.current}</h1>;
}
```

可以在事件处理程序或者Effect中读取和写入ref

```jsx
function MyComponent() {
  // ...
  useEffect(() => {
    // ✅ 可以在 Effect 中读取和写入 ref
    myRef.current = 123;
  });
  // ...
  function handleClick() {
    // ✅ 可以在事件处理程序中读取和写入 ref
    doSomething(myOtherRef.current);
  }
  // ...
}
```

如果不得不在渲染期间读取或者写入 那么应该使用state代替

当打破这些规则时 组件可能仍然可以工作 但我们为React添加的大多数新功能将依赖于这些预期行为

##### 通过ref操作DOM

使用ref操作DOM是非常常见的行为 React内置了对它的支持

首先 声明一个初始值为null的ref对象 然后将ref属性传递给想要操作的DOM节点的JSX

```jsx
import { useRef } from 'react';

function MyComponent() {
  const inputRef = useRef(null);
  // ...
  return <input ref={inputRef} />;
}
```

当React创建DOM节点并将其渲染到屏幕时 React将会把DOM节点设置为ref对象的current属性 现在你可以借助ref对象访问`<input>`的DOM节点 并且可以调用类似于`focus()`的方法

```jsx
  function handleClick() {
    inputRef.current.focus();
  }
```

当节点从屏幕上移除时 React将把current属性设置回null

##### 避免重复创建ref的内容

React会保存ref的初始值 并在后续的渲染中忽略它

```jsx
function Video() {
  const playerRef = useRef(new VideoPlayer());
  // ...
}
```

虽然`new VideoPlayer()`的结果只会在首次渲染时使用 但是依然在每次渲染时都在调用这个方法 如果是创建昂贵的对象 这可能是一种浪费

为了解决这个问题 可以修改ref的初始化方式

```jsx
function Video() {
  const playerRef = useRef(null);
  if (playerRef.current === null) {
    playerRef.current = new VideoPlayer();
  }
  // ...
}
```

通常情况下 在渲染过程中写入或读取ref.current是不允许的 然而 在这种情况下是可以的 因为结果总是一样的 而且条件只有在初始化时执行 所以完全是可以预测的

如果使用了类型检查器 并且不想总是检查null 可以尝试以下方案：

```jsx
function Video() {
  const playerRef = useRef(null);

  function getPlayer() {
    if (playerRef.current !== null) {
      return playerRef.current;
    }
    const player = new VideoPlayer();
    playerRef.current = player;
    return player;
  }

  // ...
}
```

在这里 playerRef本身是可以为空的 然而应该能够使类型检查器确信 不存在`getPlayer()`返回null的情况 然后在事件处理程序中调用`getPlayer()`

⚠️注意：

