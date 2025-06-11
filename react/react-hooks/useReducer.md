### useReducer

useReducer是一个React Hook 它允许你向组件里面添加一个reducer

```jsx
const [state, dispatch] = useReducer(reducer, initialArg, init?)
```

在组件的顶层作用域调用useReducer以创建一个用于管理状态的reducer

```jsx
import { useReducer } from 'react';

function reducer(state, action) {
  // ...
}

function MyComponent() {
  const [state, dispatch] = useReducer(reducer, { age: 42 });
  // ...
}
```

参数：

reducer：用于更新state的纯函数 参数为state和action 返回值是更新后的state state与action可以是任意合法值

initialArg：用于初始化state的任意值 初始值的计算逻辑取决于接下来的init参数

可选参数init：用于计算初始值的函数 如果存在 使用init(initialArg)的执行结果作为初始值 否则使用initialArg


返回值：

useReducer返回一个由两个值组成的数组：

1. 当前的state 初次渲染时 它是init(initialArg)或initialArg(如果没有init函数)

2. dispatch函数 用于更新state并触发组件的重新渲染

注意事项：

1. useReducer是一个Hook 所以只能在组件的顶层作用域或自定义Hook中调用 而不能在循环或条件语句中调用 如果你有这种需求 可以创建一个新的组件 并把state移入其中

2. dispatch函数具有稳定的标识 所以你经常会看到Effect的依赖数据中会省略它 即使包含它也不会导致Effect重新触发 如果linter允许你省略依赖项并且没有报错 那么你就可以安全地省略它

3. 严格模式下 React会调用两次reducer和初始化函数 这可以帮助你发现意外的副作用 这只是开发模式下的行为 并不会影响生产环境 只要reducer和初始化函数是纯函数（理应如此）就不会改变你的逻辑 其中一个调用结果会被忽略

#### dispatch函数

useReducer返回的dispatch函数允许你更新state并触发组件的重新渲染 它需要传入一个action作为参数

```jsx
const [state, dispatch] = useReducer(reducer, { age: 42 });

function handleClick() {
  dispatch({ type: 'incremented_age' });
  // ...
}
```

React会调用reducer函数以更新state reducer函数的参数为当前的state与传递的action

参数：

action：用户执行的操作 可以是任意类型的值 通常来说action是一个对象 其中type属性标识类型 其它属性携带额外信息

返回值：没有返回值

**注意**

1. dispatch函数是为下一次渲染而更新state 因此在调用dispatch函数后读取state并不会拿到更新后的值 也就是说只能获取到调用前的值

2. 如果你提供的新值与当前的state相同（使用Object.is比较）React会跳过组件和子组件的重新渲染 这是一种优化手段 虽然在跳过重新渲染前React可能会调用你的组件 但是这不应该影响你的代码

3. React会批量更新state state会在所有事件函数执行完毕 并且已经调用过它的set函数后进行更新 这可以防止在一个事件中多次进行重新渲染 如果在访问DOM等极少数的情况下 需要强制React提前更新 可以使用flushSync

#### 用法

##### 向组件添加reducer

在组件的顶层作用域调用useReducer来创建一个用于管理状态（state）的reducer

useReducer返回一个由两个值组成的数组：

1. 当前的state 首次渲染时为你提供的初始值

2. dispatch函数 让你可以根据交互修改state

为了更新屏幕上的内容 使用一个表示用户操作的action来调用dispatch函数

```jsx
function handleClick() {
  dispatch({ type: 'incremented_age' });
}
```

React会把当前的state和这个action一起作为参数传给reducer函数 然后reducer计算并返回新的state 最后React保存新的state 并使用它渲染组件和更新UI

```jsx
import { useReducer } from 'react';

function reducer(state, action) {
  if (action.type === 'incremented_age') {
    return {
      age: state.age + 1
    };
  }
  throw Error('Unknown action.');
}

export default function Counter() {
  const [state, dispatch] = useReducer(reducer, { age: 42 });

  return (
    <>
      <button onClick={() => {
        dispatch({ type: 'incremented_age' })
      }}>
        Increment age
      </button>
      <p>Hello! You are {state.age}.</p>
    </>
  );
}
```

useReducer和useState非常相似 但是它可以让你把状态更新逻辑从事件处理函数中移动到组件外部

##### 实现reducer函数

reducer函数的定义如下

```jsx
function reducer(state, action) {
  // ...
}
```

你需要往函数体里面添加计算并返回新的state逻辑 一般会使用switch语句来完成 在switch语句中通过匹配case条件来计算并返回相应的state

```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'incremented_age': {
      return {
        name: state.name,
        age: state.age + 1
      };
    }
    case 'changed_name': {
      return {
        name: action.nextName,
        age: state.age
      };
    }
  }
  throw Error('Unknown action: ' + action.type);
}
```

action可以是任意类型 不过通常至少是一个存在type属性的对象 也就是说它需要携带计算新的state值所必须的数据

```jsx
function Form() {
  const [state, dispatch] = useReducer(reducer, { name: 'Taylor', age: 42 });
  
  function handleButtonClick() {
    dispatch({ type: 'incremented_age' });
  }

  function handleInputChange(e) {
    dispatch({
      type: 'changed_name',
      nextName: e.target.value
    });
  }
  // ...
}
```

action的type依赖于组件的实际情况 即使它会导致数据的多次更新 每个action都只描述一次交互 state的类型也是任意的 不过一般会使用对象或数组

⚠️注意：state是只读的 即使是对象或数组也不要尝试修改它

```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'incremented_age': {
      // 🚩 不要像下面这样修改一个对象类型的 state：
      state.age = state.age + 1;
      return state;
    }
  }
  throw Error('Unknown action: ' + action.type);
}

// 🚩 正确的做法是返回新的对象
function reducer(state, action) {
  switch (action.type) {
    case 'incremented_age': {
      // ✅ 正确的做法是返回新的对象
      return {
        ...state,
        age: state.age + 1
      };
    }
  }
}
```

如果使用复制方法更新数组和对象让你不厌其烦 那么可以使用immer这样的库来减少一些重复的样板代码 immer让你可以专注于逻辑 因为它在内部均使用复制方法来完成更新

```jsx
import { useImmerReducer } from 'use-immer';
import AddTask from './AddTask.js';
import TaskList from './TaskList.js';

function tasksReducer(draft, action) {
  switch (action.type) {
    case 'added': {
      draft.push({
        id: action.id,
        text: action.text,
        done: false
      });
      break;
    }
    case 'changed': {
      const index = draft.findIndex(t =>
        t.id === action.task.id
      );
      draft[index] = action.task;
      break;
    }
    case 'deleted': {
      return draft.filter(t => t.id !== action.id);
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}

let nextId = 3;
const initialTasks = [
  { id: 0, text: 'Visit Kafka Museum', done: true },
  { id: 1, text: 'Watch a puppet show', done: false },
  { id: 2, text: 'Lennon Wall pic', done: false },
];

export default function TaskApp() {
  const [tasks, dispatch] = useImmerReducer(
    tasksReducer,
    initialTasks
  );

  function handleAddTask(text) {
    dispatch({
      type: 'added',
      id: nextId++,
      text: text,
    });
  }

  function handleChangeTask(task) {
    dispatch({
      type: 'changed',
      task: task
    });
  }

  function handleDeleteTask(taskId) {
    dispatch({
      type: 'deleted',
      id: taskId
    });
  }

  return (
    <>
      <h1>Prague itinerary</h1>
      <AddTask
        onAddTask={handleAddTask}
      />
      <TaskList
        tasks={tasks}
        onChangeTask={handleChangeTask}
        onDeleteTask={handleDeleteTask}
      />
    </>
  );
}
```

##### 避免重新创建初始值

React会保存state的初始值并在下一次渲染时忽略它

```jsx
function createInitialState(username) {
  // ...
}

function TodoList({ username }) {
  const [state, dispatch] = useReducer(reducer, createInitialState(username));
  // ...
}
```

虽然createInitialState(username)的返回值只用于初次渲染 但是在每一次渲染的时候都会被调用 如果它创建了比较大的数组或者执行了昂贵的计算就会浪费性能

你可以通过给useReducer的第三个参数传入初始化函数来解决这个问题

```jsx
function createInitialState(username) {
  // ...
}

function TodoList({ username }) {
  const [state, dispatch] = useReducer(reducer, username, createInitialState);
  // ...
}
```

需要注意的是你传入的参数是createInitialState这个函数自身 而不是执行createInitialState()后的返回值 这样传参就可以保证初始化函数不会再次运行

在上面这个例子中 createInitialState有一个username参数 如果初始化函数不需要参数就可以计算出初始值 可以把useReducer的第二个参数改为null


⚠️注意：

调用dispatch函数 不会改变当前渲染的state

```jsx
function handleClick() {
  console.log(state.age);  // 42

  dispatch({ type: 'incremented_age' }); // 用 43 进行重新渲染
  console.log(state.age);  // 还是 42！

  setTimeout(() => {
    console.log(state.age); // 一样是 42！
  }, 5000);
}
```

这是因为state的行为和快照一样 更新state会使用新的值来对组件进行重新渲染 但是不会改变当前执行的事件处理函数里面state的值

如果你需要获取更新后state 可以手动调用reducer来得到结果：

```jsx
const action = { type: 'incremented_age' };
dispatch(action);

const nextState = reducer(state, action);
console.log(state);     // { age: 42 }
console.log(nextState); // { age: 43 }
```

React 使用Object.is比较更新前后的state 如果它们相等就会跳过这次更新

避免报错： “Too many re-renders” 

```jsx
// 🚩 错误：渲染期间调用了处理函数
return <button onClick={handleClick()}>Click me</button>

// ✅ 修复：传递一个处理函数，而不是调用
return <button onClick={handleClick}>Click me</button>

// ✅ 修复：传递一个内联的箭头函数
return <button onClick={(e) => handleClick(e)}>Click me</button>
```

只有组件、初始化函数和 reducer 函数需要是纯函数。事件处理函数不需要实现为纯函数 并且React永远不会调用事件函数两次

