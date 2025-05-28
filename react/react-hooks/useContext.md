### useContext

`useContext` 是一个允许你读取和订阅组件中 context 的 React Hook。

```jsx
const value = useContext(SomeContext);
```
参数
SomeContext: 先前用 createContext 创建的 context 对象 context 本身不包含信息 只代表你可以提供或从组件中读取的信息类型

返回值
`useContext` 为调用组件返回 context 的值 它是调用组件上层组件中距离当前组件最近的 `<SomeContext.Provider>` 的 `value` 值 如果没有这样的 provider 那么返回值将会是创建改 context 时传入的 `defaultValue` 返回的值始终是最新的 如果 context 发生变化 React 会自动重新渲染读取 context 的组件

注意事项
1. 组件中 useContext() 调用不受 同一 组件返回的 provider 的影响 相应的 <Context.Provider> 需要位于调用 useContext() 的组件 之上
2. 从 provider 接收到不同的 value 开始 React 自动重新渲染使用了该特定 provider 的所有子级 先前的值和新的值会使用 Object.is 比较 使用 memo 来跳过重新渲染并不妨碍子级接收到新的 context 值
3. 通过 context 传递数据只有在用于传递 context 的 SomeContext 和用于读取数据的 SomeContext 是完全相同的对象时才有效 这是由 === 比较的

#### 用法

##### 向组件树深层传递数据
```jsx
// 在组件的最顶级调用 useContext 来获取和订阅 context
import { useContext } from 'react';

function Button() {
  const theme = useContext(ThemeContext);
  // ...
}
```
useContext 返回你向 context 传递的 context value 为了确定 context 的值 React 搜索组件树 为这个特定的 context 向上查找最近的 context provider

若要将 context 传递给 button 请将其或其父组件之一包装到相应的 context provider 中
```jsx
function MyPage() {
  return (
    <ThemeContext.Provider value="dark">
      <Form />
    </ThemeContext.Provider>
  );
}

function Form() {
  // ... 在内部渲染 buttons ...
  return (
    <div>
      <Button />
    </div>
  );
}
// provider 与 button 之间有多少层组件并不重要 当 Form 中任何位置的 button 调用 useContext(ThemeContext) 时 它都将接收 "dark" 作为值
// useContext 总是在调用它的组件的父组件中查找最近的 provider 不考虑调用 useContext() 的组件中的 provider
```

在大型应用程序中，通常将 context 和 reducer 结合起来从组件中抽离与某种状态相关的逻辑。在本例中，所有的“线路”都隐藏在 TasksContext.js 中，它包含一个 reducer 和两个单独 context

```jsx
// TasksContext.js
import { createContext, useContext, useReducer } from 'react';

const TasksContext = createContext(null);

const TasksDispatchContext = createContext(null);

export function TasksProvider({ children }) {
  const [tasks, dispatch] = useReducer(
    tasksReducer,
    initialTasks
  );

  return (
    <TasksContext.Provider value={tasks}>
      <TasksDispatchContext.Provider value={dispatch}>
        {children}
      </TasksDispatchContext.Provider>
    </TasksContext.Provider>
  );
}

export function useTasks() {
  return useContext(TasksContext);
}

export function useTasksDispatch() {
  return useContext(TasksDispatchContext);
}

function tasksReducer(tasks, action) {
  switch (action.type) {
    case 'added': {
      return [...tasks, {
        id: action.id,
        text: action.text,
        done: false
      }];
    }
    case 'changed': {
      return tasks.map(t => {
        if (t.id === action.task.id) {
          return action.task;
        } else {
          return t;
        }
      });
    }
    case 'deleted': {
      return tasks.filter(t => t.id !== action.id);
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}

const initialTasks = [
  { id: 0, text: 'Philosopher’s Path', done: true },
  { id: 1, text: 'Visit the temple', done: false },
  { id: 2, text: 'Drink matcha', done: false }
];

```


##### 指定后备方案默认值

如果 React 没有在父树中找到该特定 context 的任何 provider useContext() 返回的 context 值将等于你在创建 context 时传入的 defaultValue 默认值从不改变

##### 覆盖组件树一部分的 context

通过在 provider 中使用不同的值包装树的某个部分 可以覆盖该部分的 context 可以根据需要多次嵌套和覆盖 provider

```jsx
<ThemeContext.Provider value="dark">
  ...
  <ThemeContext.Provider value="light">
    <Footer />
  </ThemeContext.Provider>
  ...
</ThemeContext.Provider>
```

在嵌套使用 context provider 时 可以“累积”信息 在此示例中 Section 组件记录了 LevelContext 该 context 指定了 section 嵌套的深度 它从父级 section 中读取 LevelContext 然后把 LevelContext 的数值加一传递给子级 因此，Heading 组件可以根据被 Section 组件嵌套的层数自动决定使用 <h1>，<h2>，<h3>，…，中的哪种标签

```jsx
// Section.js
import { useContext } from 'react';
import { LevelContext } from './LevelContext.js';

export default function Section({ children }) {
  const level = useContext(LevelContext);
  return (
    <section className="section">
      <LevelContext.Provider value={level + 1}>
        {children}
      </LevelContext.Provider>
    </section>
  );
}

// Heading.js
import { useContext } from 'react';
import { LevelContext } from './LevelContext.js';

export default function Heading({ children }) {
  const level = useContext(LevelContext);
  switch (level) {
    case 0:
      throw Error('Heading must be inside a Section!');
    case 1:
      return <h1>{children}</h1>;
    case 2:
      return <h2>{children}</h2>;
    case 3:
      return <h3>{children}</h3>;
    case 4:
      return <h4>{children}</h4>;
    case 5:
      return <h5>{children}</h5>;
    case 6:
      return <h6>{children}</h6>;
    default:
      throw Error('Unknown level: ' + level);
  }
}

// LevelContext.js
import { createContext } from 'react';

export const LevelContext = createContext(0);
```

##### 在传递对象和函数时优化重新渲染

context 可以传递任何值 包括对象和函数

```jsx
function MyApp() {
  const [currentUser, setCurrentUser] = useState(null);

  function login(response) {
    storeCredentials(response.credentials);
    setCurrentUser(response.user);
  }

  return (
    <AuthContext.Provider value={{ currentUser, login }}>
      <Page />
    </AuthContext.Provider>
  );
}
```

此处 context value 是一个具有两个属性的 javascript 对象 其中一个是函数 每当 MyApp 出现重新渲染（如 路由更新） 这里将会是一个新的对象指向不同的函数 因此 React 还必须重新渲染树中调用 useContext(AuthContext) 的所有组件

在较小的应用中 这不是问题 但是 如果基础数据如 currentUser 没有变化 则不需要重新渲染他们 为了帮助 React 利用这一点 你可以使用 useCallback 包装 login 函数 并将对象创建包装到 useMemo 中

```jsx
import { useCallback, useMemo } from 'react';

function MyApp() {
  const [currentUser, setCurrentUser] = useState(null);

  const login = useCallback((response) => {
    storeCredentials(response.credentials);
    setCurrentUser(response.user);
  }, []);

  const contextValue = useMemo(() => ({
    currentUser,
    login
  }), [currentUser, login]);

  return (
    <AuthContext.Provider value={contextValue}>
      <Page />
    </AuthContext.Provider>
  );
}
// 根据以上改变 即使 MyApp 需要重新渲染 调用 useContext(AuthContext) 的组件也不需要重新渲染 除非 currentUser 发生了变化
```

注意 只有在上层根本没有匹配的 provider 时才使用 createContext(defaultValue) 调用的默认值 如果存在 <SomeContext.Provider value={undefined}> 组件在父树的某个位置 调用 useContext(SomeContext) 的组件将会接收到 undefined 作为 context 的值

