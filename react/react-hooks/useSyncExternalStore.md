### useSyncExternalStore

useSyncExternalStore 是一个让你订阅外部 store 的 React Hook

```jsx
const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)
```

在组件顶层调用useSyncExternalStore以从外部store读取值

```jsx
import { useSyncExternalStore } from 'react';
import { todosStore } from './todoStore.js';

function TodosApp() {
  const todos = useSyncExternalStore(todosStore.subscribe, todosStore.getSnapshot);
  // ...
}
```

它返回store中数据的快照 你需要传两个函数作为参数：

1. subscribe 函数应当订阅该store并返回一个取消订阅的函数

2. getSnapshot 函数应当从该store读取数据的快照

参数：

`subscribe` 一个函数 接收一个单独的callback参数 并把它订阅到store上 当store发生改变时会调用提供的callback 这将导致React重新调用getSnapshot 并在需要的时候重新渲染组件 subscribe函数会返回清除订阅的函数

`getSnapshot` 一个函数 返回组件需要的store中的数据快照 在store不变的情况下 重复调用getSnapshot必须返回同一个值 如果store改变 并且返回值也不同了（使用Object.is比较）React就会重新渲染组件

可选`getServerSnapshot` 一个函数 返回store中数据的初始快照 它只会在服务端渲染时 以及在客户端进行服务端渲染内容的激活时被用到 快照在服务端与客户端之间必须相同 它通常是从服务端序列化并传到客户端的 如果你忽略此参数 在服务端渲染这个组件会抛出一个错误

返回值：

改store的当前快照 可以在你的渲染逻辑中使用

⚠️警告：

1. getSnapshot返回的store快照必须是不可变的 如果底层store有可变数据 要在数据改变时返回一个新的不可变快照 否则 返回上次缓存的快照

2. 如果在重新渲染时传入一个不同的subscribe函数 React会用新传入的subscribe函数 React会用新传入的subscribe函数重新订阅该store 你可以通过在组件外声明subscribe来避免

3. 如果在非阻塞Transition更新过程中更改了store React将会回退并将该更新视为阻塞更新 具体来说 在每次Transition更新时 React将在将更改应用到DOM之前第二次调用getSnapshot 如果它返回的值与最初调用时不同 React将从头开始进行更新 这次将其作为阻塞更新应用 以确保屏幕上的每个组件都反映store的相同版本

4. 不建议根据useSyncExternalStore返回的store值暂停渲染 原因是对外部store的变更无法被标记为非阻塞Transition更新 因此它们会触发最近的Suspense后备方案 用加载旋转器替换已经呈现在屏幕上的内容 通常会导致较差的用户体验

例如 以下操作是不建议的

```jsx
const LazyProductDetailPage = lazy(() => import('./ProductDetailPage.js'));

function ShoppingApp() {
  const selectedProductId = useSyncExternalStore(...);

  // ❌ Calling `use` with a Promise dependent on `selectedProductId`
  const data = use(fetchItem(selectedProductId))

  // ❌ Conditionally rendering a lazy component based on `selectedProductId`
  return selectedProductId != null ? <LazyProductDetailPage /> : <FeaturedProducts />;
}
```

#### 使用

##### 订阅外部store

你的多数组件只会从它们的props state以及context读取数据 然而有时一个组件需要从一些React之外的store读取一些随时间变化的数据 包括：

- 在React之外持有状态的第三方状态管理库

- 暴露出一个可变值及订阅其改变事件的浏览器API

在组件顶层调用useSyncExternalStore以从外部store读取值

```jsx
import { useSyncExternalStore } from 'react';
import { todosStore } from './todoStore.js';

function TodosApp() {
  const todos = useSyncExternalStore(todosStore.subscribe, todosStore.getSnapshot);
  // ...
}
```

它返回store中数据的快照 你需要传两个函数作为参数

1. subscribe函数 应当订阅store并返回一个取消订阅函数

2. getSnapshot函数 应当从store中读取数据的快照

React会用这些函数来保持你的组件订阅到store并在它改变时重新渲染

例如 在下面的沙盒中 todosStore被实现为一个保存React之外数据的外部store TodosApp组件通过useSyncExternalStore Hook连接到外部store

```jsx
// todoStore.js
// 这是一个第三方 store 的例子，
// 你可能需要把它与 React 集成。

// 如果你的应用完全由 React 构建，
// 我们推荐使用 React state 替代。

let nextId = 0;
let todos = [{ id: nextId++, text: 'Todo #1' }];
let listeners = [];

export const todosStore = {
  addTodo() {
    todos = [...todos, { id: nextId++, text: 'Todo #' + nextId }]
    emitChange();
  },
  subscribe(listener) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
  getSnapshot() {
    return todos;
  }
};

function emitChange() {
  for (let listener of listeners) {
    listener();
  }
}

// App.js
import { useSyncExternalStore } from 'react';
import { todosStore } from './todoStore.js';

export default function TodosApp() {
  const todos = useSyncExternalStore(todosStore.subscribe, todosStore.getSnapshot);
  return (
    <>
      <button onClick={() => todosStore.addTodo()}>Add todo</button>
      <hr />
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </>
  );
}
```

⚠️注意：
当可能的时候 我们推荐通过useState和useReducer使用内建的React state代替 如果你需要去集成已有的非React代码 useSyncExternalStore API是很有用的

##### 订阅浏览器API

添加useSyncExternalStore的另一个场景是当你想订阅一些由浏览器暴露的并随时间变化的值时 例如假设你想要组件展示网络连接是否正常 浏览器通过一个叫做navigator.onLine的属性暴露这一信息

这个值可能在React不知道的情况下改变 所以你应当通过useSyncExternalStore来读取它

```jsx
import { useSyncExternalStore } from 'react';

function ChatIndicator() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);
  // ...
}
```

从浏览器API读取当前值 来实现getSnapshot函数

```jsx
function getSnapshot() {
  return navigator.onLine;
}
```

接下来 实现subscribe函数 例如 当navigator.onLine改变时 触发浏览器window对象的online和offline事件 然后返回一个清除订阅的函数：

```jsx
function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}
```

现在 React 知道如何从外部的 navigator.onLine API 读到这个值以及如何订阅其改变 断开你的设备的网络 就可以观察到组件重新渲染了

```jsx
import { useSyncExternalStore } from 'react';

export default function ChatIndicator() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);
  return <h1>{isOnline ? '✅ Online' : '❌ Disconnected'}</h1>;
}

function getSnapshot() {
  return navigator.onLine;
}

function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}
```

##### 把逻辑抽取到自定义Hook

通常不会在组件里直接使用useSyncExternalStore 而是在自定义Hook里调用它 这使得你可以在不同组件里使用相同的外部store

例如 这里自定义的useOnlineStatus Hook追踪网络是否在线

```jsx
import { useSyncExternalStore } from 'react';

function getSnapshot() {
  return navigator.onLine;
}

function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);
  return isOnline;
}
```

现在不同的组件都可以调用useOnlineStatus Hook 不必重复底层实现

##### 添加服务端渲染支持

如果你的React应用使用服务端渲染 你的React组件也会运行在浏览器环境之外来生成初始HTML 这给连接到外部store造成了一些挑战

1. 如果你连接到一个浏览器特有的API 因为它在服务端不存在 所以是不可行的

2. 如果你连接到一个第三方store 数据要在服务端和客户端之间相匹配

为了解决这些问题 要传一个getServerSnapshot函数作为第三个参数给useSyncExternalStore

```jsx
import { useSyncExternalStore } from 'react';

export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return isOnline;
}

function getSnapshot() {
  return navigator.onLine;
}
function getServerSnapshot() {
  return true; // 服务端生成的 HTML 总是显示“在线”
}

function subscribe(callback) {
  // ...
}
```

getServerSnapshot函数与getSnapshot相似 但它只在两种情况下才运行

1. 在服务端生成HTML时

2. 在客户端hydration时 即当React拿到服务端的HTML并使其可交互

这让你提供初始快照值 该值将在应用程序变得可交互之前被使用 如果对于服务器渲染来说没有一个合适的初始值 则省略此参数以强制在客户端上进行渲染

⚠️注意：

确保客户初始渲染与服务端渲染时 getServerSnapshot 返回完全相同的数据 例如 如果在服务端 getServerSnapshot 返回一些预先载入的store内容 你就需要把这些内容也传给客户端 一种方法时在服务端渲染时 生成`<script>`标签来设置像window.MY_STORE_DATA这样的全局变量 并在客户端getServerSnapshot内读取此全局变量 你的外部store应当提供如何这样做的说明

**遇到一个错误：“The result of getSnapshot should be cached”**

这个错误意味着你的getSnapshot函数每次调用都返回了一个新对象 例如

```jsx
function getSnapshot() {
  // 🔴 getSnapshot 不要总是返回不同的对象
  return {
    todos: myStore.todos
  };
}
```

如果getSnapshot返回值不同于上一次 React会重新渲染组件 这就是为什么 如果总是返回一个不同的值 会进入到一个无限循环 并产生这个报错

只有当确实有东西改变了 getSnapshot才应该返回一个不同的对象 如果你的store包含不可变数据 可以直接返回此数据

```jsx
function getSnapshot() {
  // ✅ 你可以返回不可变数据
  return myStore.todos;
}
```

如果你的store数据是可变的 getSnapshot函数应当返回一个它的不可变快照 这意味着确实需要创建新对象 但不是每次调用都如此 而是应当保存最后一次计算得到的快照 并且在store中的数据不变的情况下 返回与上一次相同的快照 如何决定可变数据发生了改变则取决于你的可变store

**我的subscribe函数每次重新渲染都被调用**

```jsx
function ChatIndicator() {
  // 🚩 总是不同的函数，所以 React 每次重新渲染都会重新订阅
  function subscribe() {
    // ...
  }
  
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);

  // ...
}
```

如果重新渲染时你传一个不同的subscribe函数 React会重新订阅你的store 如果这造成了性能问题 因而你想避免重新订阅 就把subscribe函数移到外面

```jsx
// ✅ 总是相同的函数，所以 React 不需要重新订阅
function subscribe() {
  // ...
}

function ChatIndicator() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);
  // ...
}
```

或者把subscribe包在useCallback里面以便只在某些参数改变时重新订阅

```jsx
function ChatIndicator({ userId }) {
  // ✅ 只要 userId 不变，都是同一个函数
  const subscribe = useCallback(() => {
    // ...
  }, [userId]);
  
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);

  // ...
}
```