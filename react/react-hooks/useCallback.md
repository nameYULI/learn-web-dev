### useCallback

`useCallback` 是一个允许在多次渲染中缓存函数的 React Hook。

`useCallback(fn, dependencies)`

`fn`: 多次渲染中需要缓存的函数；

`dependencies`: 函数内部需要用到的所有组件内部值的依赖列表

初次渲染 在 `useCallback` 处接收的返回函数将会是已经传入的函数

在之后的渲染中 React 将会使用 `Object.is` 把当前依赖和已传入之前的依赖进行比较 如果没有任何依赖改变 `useCallback` 将会与之前一样的函数。否则 `useCallback` 将返回 此次 渲染中传递的函数

简而言之 `useCallback` 会在多次渲染中缓存一个函数，直至这个函数的依赖发生变化

如果你忘记使用依赖数组 `useCallback` 每一次都将返回一个新的函数

```jsx
import { useCallback } from 'react';

export default function ProductPage({ productId, referrer, theme }) {
  const handleSubmit = useCallback((orderDetails) => {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails,
    });
  }, [productId, referrer]);
  return (
    <div className={theme}>
      <ShippingForm onSubmit={handleSubmit} />
    </div>
  );
}
```

参考上面示例，切换 `theme` props 后会让应用停滞一小会儿，但如果将 `<ShippingForm />` 从 JSX 中移除 应用将反应迅速 这就提示尽力优化 `ShippingForm` 组件将会很有用

**默认情况下 当一个组件重新渲染时 React 将递归渲染它的所有子组件** 因此每当 `theme` 改变时 `ProductPage` 组件重新渲染时 `ShippingForm` 组件也会重新渲染 这对于不需要大量计算去重新渲染的组件来说影响很小 但如果你发现某次重新渲染很慢 你可以将 `ShippingForm` 组件包裹在 `memo` 中 如果 props 和上一次渲染时相同 那么 `ShippingForm` 组件将跳过重新渲染

```jsx
import { memo } from 'react';

const ShippingForm = memo(({ onSubmit }) => {
  return <form onSubmit={onSubmit}>...</form>;
});
```

当代码像上面一样改变后 如果 props 与上一次渲染时相同 `ShippingForm` 组件将跳过重新渲染 这时缓存函数就变得很重要

```jsx
function ProductPage({ productId, referrer, theme }) {
  // 每当 theme 改变时，都会生成一个不同的函数
  function handleSubmit(orderDetails) {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails,
    });
  }
  
  return (
    <div className={theme}>
      {/* 这将导致 ShippingForm props 永远都不会是相同的，并且每次它都会重新渲染 */}
      <ShippingForm onSubmit={handleSubmit} />
    </div>
  );
}
```

与字面量对象 `{}` 总是会创建新对象类似 在 `JavaScript` 中 `function () {}` 或者 `() => {}` 总是会生成不同的函数 正常情况下 这不会有问题 但是这意味着 `ShippingForm` props 将永远不会是相同的 并且 `memo` 对性能的优化永远不会生效 这就是 `useCallback` 起作用的地方

```jsx
function ProductPage({ productId, referrer, theme }) {
  // 在多次渲染中缓存函数
  const handleSubmit = useCallback((orderDetails) => {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails,
    });
  }, [productId, referrer]); // 只要这些依赖没有改变

  return (
    <div className={theme}>
      {/* ShippingForm 就会收到同样的 props 并且跳过重新渲染 */}
      <ShippingForm onSubmit={handleSubmit} />
    </div>
  );
}
```

**将 `handleSubmit` 传递给 `useCallback` 就可以确保它在多次重新渲染直接时相同的函数** 直到依赖发生变化 注意：除非出于某种特定原因 否则不必将一个函数包裹在 `useCallback` 中 在本例中 将它传递到了包裹在 `memo` 中的组件 这允许它跳过重新渲染

#### 用法
##### 跳过组件的重新渲染
```jsx
// 参考上面的例子
```
##### 从记忆化回调中更新 state
```jsx
function TodoList() {
  const [todos, setTodos] = useState([]);

  const handleAddTodo = useCallback((text) => {
    const newTodo = { id: nextId++, text };
    setTodos(todos => [...todos, newTodo]);
  }, []); // ✅ 不需要 todos 依赖项
  // ...
}
```
##### 防止频繁触发 Effect
```jsx
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  function createOptions() {
    return {
      serverUrl: 'https://localhost:1234',
      roomId: roomId
    };
  }

  // 这会产生一个问题，每一个响应值都必须声明为 Effect 的依赖 但是如果将 `createOptions` 声明为依赖 它会导致 Effect 不断重新连接到聊天室

  useEffect(() => {
    const options = createOptions();
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [createOptions]) // 🔴 问题：这个依赖在每一次渲染中都会发生改变
}

// 为了解决这个问题 需要在 Effect 中将要调用的函数包裹在 `useCallback` 中
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  const createOptions = useCallback(() => {
    return {
      serverUrl: 'https://localhost:1234',
      roomId: roomId
    };
  }, [roomId]); // ✅ 仅当 roomId 更改时更改

  useEffect(() => {
    const options = createOptions();
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [createOptions]) // ✅ 仅当 createOptions 更改时更改
}

// 这将确保如果 `roomId` 相同 `createOptions` 在多次渲染中会是同一个函数 但是 最好是消除对函数依赖项的需求 将你的函数移入 Effect 内部
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    function createOptions() { // ✅ 无需使用回调或函数依赖！
      return {
        serverUrl: 'https://localhost:1234',
        roomId: roomId
      };
    }
    const options = createOptions();
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]) // ✅ 仅当 roomId 更改时更改
}
```

##### 优化自定义 hook
```jsx
// 如果你正在编写一个自定义 hook 建议将它返回的任何函数包裹在 `useCallback` 中 这确保了 hook 的使用者在需要时能够优化自己的代码
function useRouter() {
  const { dispatch } = useContext(RouterStateContext);

  const navigate = useCallback((url) => {
    dispatch({ type: 'navigate', url });
  }, [dispatch]);

  const goBack = useCallback(() => {
    dispatch({ type: 'back' });
  }, [dispatch]);

  return {
    navigate,
    goBack,
  };
}
```