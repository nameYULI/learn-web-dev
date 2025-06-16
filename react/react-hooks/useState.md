### useState

useState是一个React Hook 它允许你向组件添加一个状态变量

```jsx
const [state, setState] = useState(initialState)
```

参考：

在组件的顶层调用useState来声明一个状态变量

```jsx
import { useState } from 'react';

function MyComponent() {
  const [age, setAge] = useState(28);
  const [name, setName] = useState('Taylor');
  const [todos, setTodos] = useState(() => createTodos());
  // ...
}
```

按照惯例使用`数组解构`来命名状态变量例如 `[something, setSomething]`

参数：

initialState: 你希望state初始化的值 它可以是任何类型的值 但对于函数有特殊的行为 在初始渲染后 此参数将被忽略

 如果传递函数作为`initialState` 则它将被视为`初始化函数` 它应该是纯函数 不应该接受任何参数 并且应该返回一个任何类型的值 在初始化组件时 React将调用你的初始化函数 并将其返回值存储为初始状态

返回值：

useState返回一个由两个值组成的数组：

1. 当前的state 在首次渲染时 它将与你传递的initialState相匹配

2. set函数 它可以让你将state更新为不同的值并触发重新渲染


注意事项：

useState是一个Hook 因此你只能在组件的顶层或自己的Hook中调用它 不能在循环或条件语句中调用它

在严格模式中 React将`两次调用初始化函数` 

#### set函数 例如setSomething(nextState)

useState返回的set函数允许你将state更新为不同的值并触发重新渲染 你可以直接传递新状态 也可以传递一个根据先前状态来计算新状态的函数

```jsx
const [name, setName] = useState('Edward');

function handleClick() {
  setName('Taylor');
  setAge(a => a + 1);
  // ...
}
```

参数:

nextState：你想要state更新为的值 它可以是任何类型的值 但对于函数有特殊的行为

  如果你将函数作为nextState传递 它将被视为`更新函数` 它必须是纯函数 只接受待定的state作为其唯一参数 并应返回下一个状态 React将把你的更新函数放入队列中并重新渲染组件 在下一次渲染期间 React将通过把队列中所有更新函数应用于先前的状态来计算下一个状态


⚠️注意事项：

1. set函数*仅更新*下一次渲染的状态变量 如果在调用set函数后读取状态变量 则仍会得到在调用之前显示在屏幕上的旧值

2. 如果你提供的新值与当前state相同(由`Object.is`比较确定) React将跳过重新渲染该组件及其子组件 这是一种优化 虽然在某些情况下Reat仍然需要在跳过子组件之前调用你的组件 但这不影响你的代码

3. React会批量处理状态更新 它会在所有`事件处理函数运行`并调用其set函数后更新屏幕 这可以防止在单个事件期间多次重新渲染 在某些罕见情况下 你需要强制React更早地更新屏幕 例如访问DOM 可以使用 flushSync

4. set函数具有稳定的标识 所以你经常会看到Effect的依赖数组中会省略它 即使包含它也不会导致Effect重新触发 如果linter允许你省略依赖项并且没有报错 那么你可以安全地省略它

5. 在严格模式中 React将两次调用你的更新函数 这只是开发时的行为 不影响生产

#### 使用

##### 为组件添加状态

在组件的顶层调用useState来声明一个或多个状态变量

```jsx
import { useState } from 'react';

function MyComponent() {
  const [age, setAge] = useState(42);
  const [name, setName] = useState('Taylor');
  // ...
}
```

要更新屏幕上的内容 请使用新状态调用 set 函数

```jsx
function handleClick() {
  setName('Robin');
}
```

React 会存储新状态 使用新值重新渲染组件 并更新UI

⚠️注意：

调用set函数 不会改变已经执行的代码中当前的state 它只影响下一次渲染中useState返回的内容

```jsx
function handleClick() {
  setName('Robin');
  console.log(name); // Still "Taylor"!
}
```

##### 根据先前的state更新state

假设age为42 这个处理函数三次调用setAge(age + 1) 

```jsx
function handleClick() {
  setAge(age + 1); // setAge(42 + 1)
  setAge(age + 1); // setAge(42 + 1)
  setAge(age + 1); // setAge(42 + 1)
}
```

然而 点击一次后 age将只会变为43而不是45 这是因为调用set函数不会更新已经运行代码中的age状态变量 因此 每个setAge(age+1)调用变成了setAge(43)

你可以向setAge传递一个更新函数 而不是下一个状态

```jsx
function handleClick() {
  setAge(a => a + 1); // setAge(42 => 43)
  setAge(a => a + 1); // setAge(43 => 44)
  setAge(a => a + 1); // setAge(44 => 45)
}
```

这里 a=>a+1是更新函数 它获取待定状态 并从中计算下一个状态

React将更新函数放入队列中 然后在下一次渲染期间 它将按照相同的顺序调用它们

1. a=>a+1 将接收42作为待定状态 并返回43作为下一个状态

2. a=>a+1 将接收43作为待定状态 并返回44作为下一状态

3. a=>a+1 将接收44作为待定状态 并返回45作为下一状态

现在没有其它排队的更新 因此React最终将存储45作为当前状态

按照惯例 通常将待定状态参数命名为状态变量名的第一个字母 如age为a 你也可以把它命名为prevAge或者其他你觉得更清楚的名称

React在开发环境中可能会两次调用你的更新函数来验证其是否为纯函数

⚠️注意：
**是否总是优先使用更新函数**

你可能会听到这样的建议 如果要设置的状态是根据先前的状态计算得出的 则应始终编写类似于`setAge(a=>a+1)`的代码 这样做没有害处 但也不总是必要的

在大多数情况下 这两种方法没有区别 React始终确保对于有意的用户操作 如单击 age状态变量将在下一次单击之前被更新 这意味着单击事件处理函数在事件处理开始没有得到“过时”age的风险

但是 如果在同一事件中进行多个更新 则更新函数可能会有帮助 如果访问状态变量本身不方便(在优化重新渲染时可能会遇到这种情况) 它们也很有用

如果比起轻微冗余 你更喜欢语法的一致性 你正设置的状态又是根据先前的状态计算来的 那么总是编写一个更新函数是合理的 如果它是从某个其他状态变量的先前状态计算出的 则你可能希望它们结合成一个对象 然后使用reducer

##### 更新状态中的对象和数组

你可以将对象和数组放入状态中 在React中 状态被认为是只读的 因此你应该替换它而不是改变现有对象 例如 如果你在状态中保存了一个form对象 请不要改变它

```jsx
// 🚩 不要像下面这样改变一个对象：
form.firstName = 'Taylor';
```

相反 可以通过创建一个新对象来替换整个对象

```jsx
// ✅ 使用新对象替换 state
setForm({
  ...form,
  firstName: 'Taylor'
});
```

##### 避免重复创建初始状态

React只在初次渲染时保存初始状态 后续渲染时将其忽略

```jsx
function TodoList() {
  const [todos, setTodos] = useState(createInitialTodos());
  // ...
}
```

尽管createInitialTodos的结果仅用于初始渲染 但你仍然在每次渲染时调用此函数 如果它创建大数组或执行昂贵的计算 这可能会浪费资源

为了解决这个问题 你可以将它作为初始化函数传递给useState

```jsx
function TodoList() {
  const [todos, setTodos] = useState(createInitialTodos);
  // ...
}
```

请注意 你传递的是createInitialTodos函数本身 而不是createInitialTodos() 调用该函数的结果 如果将函数传递给useState React仅在初始化期间调用它

React在开发模式下可能会调用你的初始化函数两次 以验证它们是否是纯函数

##### 使用key重置状态

在渲染列表时 你经常会遇到key属性 然而 它还有另一个用途

你可以通过向组件传递不同的key来重置组件的状态 在这个例子中 重置按钮改变version状态变量 我们将它作为一个key传递给Form组件 当key改变时 React会从头开始创建Form组件（以及它的所有子组件）所以它的状态就被重置了

```jsx
import { useState } from 'react';

export default function App() {
  const [version, setVersion] = useState(0);

  function handleReset() {
    setVersion(version + 1);
  }

  return (
    <>
      <button onClick={handleReset}>Reset</button>
      <Form key={version} />
    </>
  );
}

function Form() {
  const [name, setName] = useState('Taylor');

  return (
    <>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <p>Hello, {name}.</p>
    </>
  );
}
```

##### 存储前一次渲染的信息

通常情况下 你会在事件处理函数中更新状态 然而 在极少数情况下 你可能希望在响应渲染时调整状态 例如当props改变时 你可能希望改变状态变量

在大多数情况下 你不需要这样做：

- 如果你需要的值可以完全从当前props或其他state中计算出来 那么完全可以移除那些多余的状态 如果你担心重新计算的频率过高 可以使用useMemo Hook来帮助优化

- 如果你想重置整个组件树的状态 可以向组件传递一个不同的key

- 如果可以的话 在事件处理函数中更新所有组件状态

在极为罕见的情况下 如果上述方法都不适用 你还可以使用一种方式 在组件渲染时调用set函数来基于已经渲染的值更新状态

假设你想显示计数器自上次更改以来是否有增加或减少 count props无法告诉你这一点 你需要跟踪它的先前值 添加prevCount状态变量来跟踪它 再添加另一个状态变量trend来保存计数是否增加或减少 比较prevCount和count 如果它们不相等 则更新prevCount和trend 现在你既可以显示当前的count 也可以显示自上次渲染以来它如何改变

```jsx
import { useState } from 'react';

export default function CountLabel({ count }) {
  const [prevCount, setPrevCount] = useState(count);
  const [trend, setTrend] = useState(null);
  if (prevCount !== count) {
    setPrevCount(count);
    setTrend(count > prevCount ? 'increasing' : 'decreasing');
  }
  return (
    <>
      <h1>{count}</h1>
      {trend && <p>The count is {trend}</p>}
    </>
  );
}
```

⚠️注意：

在渲染时调用set函数时 它必须位于条件语句中 例如`prevCount!==count` 并且必须在该条件语句中调用`setPrevCount(count)` 否则你的组件将在循环中重新渲染 直到崩溃

此外 你只能像这样更新当前渲染组件的状态 在渲染过程中调用另一个组件的set函数是错误的

最后 你的set调用仍应不直接改变state来更新状态 这并不意味着你可以违反其他纯函数的规则

这种方式可能很难理解 通常最好避免使用 但是他比在effect中更新状态要好 当你在渲染期间调用set函数时 React将在你的组件使用return语句退出后立即重新渲染该组件 并在渲染子组件之前进行  这样子组件就不需要进行两次渲染 你的组件函数的其余部分仍会进行（然后结果会被丢弃） 如果你的条件判断在所有Hook调用的下方 可以提前添加一个return 以便更早地重新开始渲染