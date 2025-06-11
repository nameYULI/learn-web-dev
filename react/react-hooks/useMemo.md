### useMemo

useMemo是一个React Hook 它在每次重新渲染的时候能够缓存计算的结果

```jsx
const cachedValue = useMemo(calculateValue, dependencies)
```

参数：

calculateValue: 要缓存计算值的函数 它应该是一个没有任何参数的纯函数 并且可以返回任意类型 React将会在首次渲染时调用该函数 在之后的渲染中 如果dependencies没有发生变化 React将直接返回相同值 否则将会再次调用calculateValue并返回最新结果 然后缓存该结果以便下次重复使用

dependencies: 所有在calculateValue函数中使用的响应式变量组成的数组 响应式变量包括props、state和所有你直接在组件中定义的变量和函数

返回值：

在初次渲染时 useMemo返回不带参数调用calculateValue的结果

在接下来的渲染中 如果依赖项没有发生改变 它将返回上次缓存的值 否则将再次调用calculateValue 并返回最新结果

注意：

1. useMemo是一个React Hook 所以你只能在组件的顶层或者自定义Hook中调用中它 你不能在循环语句或条件语句中调用它 如有需要 将其提取为一个新组件并使用state

2. 在严格模式下 React将会调用你的计算函数两次 这只是一个开发环境下的行为 并不会影响到生成环境 如果计算函数是一个纯函数（它本来就应该是） 这将不会影响到代码逻辑 其中一次的调用结果将被忽略

3. 除非有特定原因 React不会丢弃缓存值 例如在开发过程中 React会在你编辑组件文件时丢弃缓存 无论是在开发环境还是生产环境 如果你的组件在初始挂载期间被终止 React都会丢弃缓存值

#### 用法

##### 跳过代价昂贵的重新计算

```jsx
import { useMemo } from 'react';

function TodoList({ todos, tab, theme }) {
  const visibleTodos = useMemo(() => filterTodos(todos, tab), [todos, tab]);
  // ...
}
```

你需要给useMemo传递两样东西

1. 一个没有任何参数的calculation函数 像这样()=> 并且返回任何你想要的计算结果

2. 一个由包含在你的组件中并在calculation中使用的所有值组成的依赖列表

在初次渲染时 你从useMemo得到的值将会是你的calculation函数执行的结果

在随后的每一次渲染中 React将会比较前后两次渲染中的所有依赖项是否相同 如果不相同 React将会重新执行calculation函数并且返回一个新的值

useMemo在多次重新渲染后缓存了calculation函数计算的结果直到依赖项的值发生变化

默认情况下 React会在每次重新渲染时重新运行整个组件 例如 如果TodoList更新了state或从父组件接收到新的props filterTodos函数将会重新运行

```jsx
function TodoList({ todos, tab, theme }) {
  const visibleTodos = filterTodos(todos, tab);
  // ...
}
```

如果计算速度很快 这将不会产生问题 但如果正在过滤转换一个大型数组 或者进行一些昂贵的计算 而数据没有改变 那么可能希望跳过这些重复计算 如果todos与tab都与上次渲染时相同 那么像之前那样将计算函数包装在useMemo中 便可以重用已经计算过的visibleTodos 这种缓存行为叫记忆化

注意：你应该仅仅把useMemo作为性能优化的手段 如果没有它 你的代码就不能正常工作 那么请先找到潜在的问题并修复它 然后再添加useMemo以提高性能


一、如何衡量计算过程的开销是否昂贵

一般来说 除非要创建或遍历数千个对象 否则开销可能并不大 如果你想获得更详细的信息 可以在控制台来测量花费在这上面的时间

```jsx
console.time('filter array');
const visibleTodos = filterTodos(todos, tab);
console.timeEnd('filter array');
```

然后执行你正在监测的交互（例如 在输入框中输入文字） 你将会在控制台看到如下日志 filter array: 0.15ms 如果全部记录的司机加起来很长（1ms或者更多） 那么记忆此计算结果是有意义的 作为对比 你可以将计算过程包裹在useMemo中 以验证该交互的总日志时间是不是减少了

```jsx
console.time('filter array');
const visibleTodos = useMemo(() => {
  return filterTodos(todos, tab); // 如果 todos 和 tab 都没有变化，那么将会跳过渲染。
}, [todos, tab]);
console.timeEnd('filter array');
```

useMemo不会让首次渲染更快 它只会帮助你跳过不必要的更新工作


二、什么情况下使用useMemo

1. 你在useMemo中进行的计算明显很慢 而且它的依赖关系很少改变

2. 将计算结果作为props传递给包裹在memo中的组件 当计算结果没有改变时 你会想跳过重新渲染 记忆化让组件仅在依赖项不同时才重新渲染

3. 你传递的值稍后用作某些Hook的依赖项 例如也许另一个useMemo计算值依赖它 或者useEffect依赖这个值

在其他情况下 将计算过程包装在useMemo中没有任何好处 不过这样做也没有重大危害 所以一些团队选择不考虑具体情况 尽可能多地使用useMemo 不过这种做法会降低代码可读性 此外并不是所有useMemo的使用都是有效的：一个“永远是新的”的单一值就足以破坏整个组件的记忆化效果

**在实践中 你可以通过遵循一些原则来避免useMemo的滥用**

1. 当一个组件在视觉上包裹其他组件时 让它将JSX作为子组件传递 这样当包装器组件更新自己的state时 React知道它的子组件不需要重新渲染

2. 首选本地state 非必要不进行状态提升 例如不要保持像表单、组件是否悬停在组件树顶部这样的瞬时状态

3. 保持你的渲染逻辑纯粹 如果重新渲染组件会导致一些问题或产生一些明显的视觉错误 那么它就是组件中的错误 修复错误而不是使用记忆化

4. 避免不必要地更新state的Effect React应用程序中的大多数性能问题都是由Effect创造的更新链引起的 这些更新链导致组件反复重新渲染

5. 尽力从Effect中移除不必要的依赖项 例如相比于记忆化 在Effect内部或组件外部移动某些对象或函数通常更简单

##### 跳过组件的重新渲染

在某些情况下 useMemo还可以帮助你优化重新渲染子组件的性能

默认情况下 当一个组件重新渲染时 React会递归地重新渲染它的所有子组件 如果某个组件渲染很慢 你可以通过将它包装在memo中 这样当它的props跟上一次渲染相同的时候它就会跳过本次渲染

```jsx
import { memo } from 'react';

const List = memo(function List({ items }) {
  // ...
});
```

通过此更改 如果List的所有props都与上次渲染时相同 则List将跳过重新渲染 这就是缓存计算变得重要的地方

```jsx
export default function TodoList({ todos, tab, theme }) {
  // 每当主题发生变化时，这将是一个不同的数组……
  const visibleTodos = filterTodos(todos, tab);
  return (
    <div className={theme}>
      {/* ... 所以List的props永远不会一样，每次都会重新渲染 */}
      <List items={visibleTodos} />
    </div>
  );
}
```

在上面的示例中 filterTodos函数总是创建一个不同数组 类似于{}总是创建一个新对象的方式  通常这不是问题 但这意味着List属性永远不会相同 并且你的memo优化将不起作用 这就是useMemo派上用场的地方

```jsx
export default function TodoList({ todos, tab, theme }) {
  // 告诉 React 在重新渲染之间缓存你的计算结果...
  const visibleTodos = useMemo(
    () => filterTodos(todos, tab),
    [todos, tab] // ...所以只要这些依赖项不变...
  );
  return (
    <div className={theme}>
      {/* ... List 也就会接受到相同的 props 并且会跳过重新渲染 */}
      <List items={visibleTodos} />
    </div>
  );
}
```

**记忆单个JSX节点**

你可以将`<List />` JSX节点本身包裹在useMemo中 而不是将List包裹在memo中

```jsx
export default function TodoList({ todos, tab, theme }) {
  const visibleTodos = useMemo(() => filterTodos(todos, tab), [todos, tab]);
  const children = useMemo(() => <List items={visibleTodos} />, [visibleTodos]);
  return (
    <div className={theme}>
      {children}
    </div>
  );
}
```

他们的行为表现是一致的 如visibleTodos没有改变 List将不会重新渲染

像`<List items={visibleTodos} />`这样的JSX节点是一个类似`{ type: List, props: { items: visibleTodos } }`的对象 创建这个对象的开销很低 但是React不知道它的内容是否和上次一样 所以默认情况下 React会重新渲染List组件

手动将JSX节点包裹到useMemo中并不方便 比如你不能在条件语句中这样做 这就是为什么通常会选择用memo包装组件而不是使用useMemo包装JSX节点

##### 防止过于频繁地触发Effect

```jsx
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  const options = useMemo(() => {
    return {
      serverUrl: 'https://localhost:1234',
      roomId: roomId
    };
  }, [roomId]); // ✅ 只有当 roomId 改变时才会被改变

  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [options]); // ✅ 只有当 options 改变时才会被改变
  // ...
}
```

然而 因为useMemo只是一个性能优化手段 而并不是语义上的保证 所以React在特定场景下会丢弃缓存值 这也会导致重新触发Effect 因此最好通过将对象移动到Effect内部来消除对函数的依赖 这样代码也更加简洁

```jsx
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const options = { // ✅ 不需要将 useMemo 或对象作为依赖！
      serverUrl: 'https://localhost:1234',
      roomId: roomId
    }
    
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // ✅ 只有当 roomId 改变时才会被改变
  // ...
}
```

##### 记忆另一个Hook的依赖

假设你有一个计算函数依赖于直接在组件主体中创建的对象

```jsx
function Dropdown({ allItems, text }) {
  const searchOptions = { matchMode: 'whole-word', text };

  const visibleItems = useMemo(() => {
    return searchItems(allItems, searchOptions);
  }, [allItems, searchOptions]); // 🚩 提醒：依赖于在组件主体中创建的对象
  // ...
}
```

依赖这样的对象会被破坏记忆 当组件重新渲染时 组件主体内的所有代码都会再次运行 创建searchOptions对象的代码也将在每次重新渲染时运行 因为searchOptions是你的useMemo调用的依赖项 而且每次都不一样 React知道依赖项是不同的 并且每次都重新计算searchItems

优化后：

```jsx
function Dropdown({ allItems, text }) {
  const searchOptions = useMemo(() => {
    return { matchMode: 'whole-word', text };
  }, [text]); // ✅ 只有当 text 改变时才会发生改变

  const visibleItems = useMemo(() => {
    return searchItems(allItems, searchOptions);
  }, [allItems, searchOptions]); // ✅ 只有当 allItems 或 serachOptions 改变时才会发生改变
  // ...
} 
```

##### 记忆一个函数

假设Form组件被包裹在memo中 你想将一个函数作为props传递给它

```jsx
export default function ProductPage({ productId, referrer }) {
  function handleSubmit(orderDetails) {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails
    });
  }

  return <Form onSubmit={handleSubmit} />;
}
```

正如`{}`每次都会创建不同的对象一样 像`function() {}`这样的函数声明和像`() => {}`这样的表达式在每次重新渲染时都会产生一个不同的函数 就其本身而言 创建一个新函数不是问题 这不是可以避免的事情 但是 如果Form被记忆化了 大概你想在没有props改变时跳过它的重新渲染 总是不同的props会破坏你的记忆化

要是用useMemo记忆函数 你的计算函数必须返回另一个函数

```jsx
export default function Page({ productId, referrer }) {
  const handleSubmit = useMemo(() => {
    return (orderDetails) => {
      post('/product/' + productId + '/buy', {
        referrer,
        orderDetails
      });
    };
  }, [productId, referrer]);

  return <Form onSubmit={handleSubmit} />;
}
```

记忆函数很常见 React有一个专门用于此的内置Hook 将你的函数包装到useCallback而不是useMemo中 以避免编写额外的嵌套函数

```jsx
export default function Page({ productId, referrer }) {
  const handleSubmit = useCallback((orderDetails) => {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails
    });
  }, [productId, referrer]);

  return <Form onSubmit={handleSubmit} />;
}
```

上面两个例子是完全等价的 useCallback的唯一好处是它可以让你避免在内部编写额外的嵌套函数 它没做任何其他事情


如果你忘记了依赖数组 useMemo将每次重新运行计算

