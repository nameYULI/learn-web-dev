### useTransition

useTransition 是一个让你可以在后台渲染部分UI的React Hook

```jsx
const [isPending, startTransition] = useTransition()
```

在组件顶层调用useTransition 将某些状态更新标记为transition

```jsx
import { useTransition } from 'react';

function TabContainer() {
  const [isPending, startTransition] = useTransition();
  // ……
}
```

参数：

useTransition 不需要任何参数

返回值：

useTransition 返回一个由两个元素组成的数组：

1. isPending 告诉你是否存在待处理的transition

2. startTransition 函数 你可以使用此方法将更新标记为transition

`startTransition`函数允许你将更新标记为Transition

```jsx
function TabContainer() {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState('about');

  function selectTab(nextTab) {
    startTransition(() => {
      setTab(nextTab);
    });
  }
  // ……
}
```

⚠️注意：

传递给startTransition的函数被称为“Actions”

传递给startTransition的函数被称为“Actions” 按照约定 任何在startTransition内调用的回调函数（例如作为回调的prop）应命名为action或包含“Action”后缀：

```jsx
function SubmitButton({ submitAction }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await submitAction();
        });
      }}
    >
      Submit
    </button>
  );
}
```

参数：

action 通过调用一个或多个set函数来更新某些状态的函数 React会立即调用action（无需参数）并将action函数调用期间同步调度的所有状态更新标记为Transition 在action中通过await等待的异步调用会被包含在Transition中 但目前需要在await之后将任何set函数再次包裹在startTransition中 标记为Transition的状态更新将具备非阻塞特性 并且不会显示不必要的加载指示

返回值：

startTransition 不返回任何值

⚠️注意：

1. useTransition是一个Hook 因此只能在组件或自定义Hook内部调用 如果需要在其他地方启动transition（例如从数据库）请调用独立的startTransition函数

2. 只有在可以访问该状态的set函数时 才能将其对应的状态更新包装为transition 如果你想启用Transition以响应某个prop或自定义Hook 请尝试使用useDeferredValue

3. 传递给startTransition的函数会被立即执行 并将在其执行期间发生的所有状态更新标记为transition 如果你尝试在setTimeout中执行状态更新 它们将不会被标记为transition

4. 你必须将任意异步请求之后的状态更新用startTransition包裹 以将其标记为Transition更新 这是一个已知限制（将在未来版本中修复）

5. startTransition函数具有稳定的标识 所以你经常会看到Effect的依赖数组中会省略它 即使包含它也不会导致Effect重新触发 如果linter允许你省略依赖项并且没有报错 那么你可以安全地省略它

6. 标记为Transition的状态更新将被其他状态更新打断 例如在Tansition中更新图表组件 并在图表组件仍在重新渲染时继续在输入框中输入 React将首先处理输入框的更新 之后再重新启动对图表组件的渲染工作

7. Transition更新不能用于控制文本输入

8. 目前React会批处理多个同时进行的transition 这是一个限制 可能会在未来版本中删除

#### 用法

##### 通过Action执行非阻塞更新

在组件的顶层调用useTransition来创建Action 并获取挂起的状态

```jsx
import {useState, useTransition} from 'react';

function CheckoutForm() {
  const [isPending, startTransition] = useTransition();
  // ……
}
```

useTransition返回一个由两个元素组成的数组：

1. isPending 告诉你是否存在待处理的transition

2. startTransition函数 你可以使用此方法创建一个Action

为了启动Transition 你需要将函数传递给startTransition 例如：

```jsx
import {useState, useTransition} from 'react';
import {updateQuantity} from './api';

function CheckoutForm() {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);

  function onSubmit(newQuantity) {
    startTransition(async function () {
      const savedQuantity = await updateQuantity(newQuantity);
      startTransition(() => {
        setQuantity(savedQuantity);
      });
    });
  }
  // ……
}
```

传递给startTransition的函数被称为“Action” 你可以在Action中更新状态和执行副作用操作 这些工作将在后台执行 不会阻塞页面的用户交互 一个Transition可以包含多个Action 且在Transition进行期间 你的用户界面将保持流畅响应 例如如果用户点击一个标签页后又改变主意点击另一个标签页 第二个点击会立即被处理 无需等待第一个更新完成

为了向用户提供Transition进行中的反馈 isPending状态会在首次调用startTransition时切换为true 并会在所有Action完成且最终状态呈现给用户前一直保持为true

Transition机制确保Action中的副作用会完整执行以避免不必要的加载指示 同时你可以通过useOptimistic在Transition进行期间提供即时反馈

##### 在组件中公开action属性

你可以通过组件暴露一个action属性 允许父组件调用一个Action

例如 这个TabButton组件将onClick事件逻辑封装到action属性中

由于父组件的状态更新在action中 所以该状态更新会被标记为transition 这意味着你可以在点击“Posts”后立即点击“Contact” 并且它不会阻止用户交互

```jsx
import { useState } from 'react';
import TabButton from './TabButton.js';
import AboutTab from './AboutTab.js';
import PostsTab from './PostsTab.js';
import ContactTab from './ContactTab.js';

export default function TabContainer() {
  const [tab, setTab] = useState('about');
  return (
    <>
      <TabButton
        isActive={tab === 'about'}
        action={() => setTab('about')}
      >
        About
      </TabButton>
      <TabButton
        isActive={tab === 'posts'}
        action={() => setTab('posts')}
      >
        Posts (slow)
      </TabButton>
      <TabButton
        isActive={tab === 'contact'}
        action={() => setTab('contact')}
      >
        Contact
      </TabButton>
      <hr />
      {tab === 'about' && <AboutTab />}
      {tab === 'posts' && <PostsTab />}
      {tab === 'contact' && <ContactTab />}
    </>
  );
}

```

```jsx
// tabButton.js
import { useTransition } from 'react';

export default function TabButton({ action, children, isActive }) {
  const [isPending, startTransition] = useTransition();
  if (isActive) {
    return <b>{children}</b>
  }
  if (isPending) {
    return <b className="pending">{children}</b>;
  }
  return (
    <button onClick={async () => {
      startTransition(async () => {
        // await the action that's passed in.
        // This allows it to be either sync or async. 
        await action();
      });
    }}>
      {children}
    </button>
  );
}
```

⚠️注意：

当从一个组件暴露出 action 属性时 子组件需要在transition中await它

##### 显示待处理的视觉状态

你可以使用useTransition的isPending 布尔值来向用户表明当前处于Transition中 例如 选项卡按钮可以有一个特殊的“pending”视觉状态

```jsx
function TabButton({ action, children, isActive }) {
  const [isPending, startTransition] = useTransition();
  // ...
  if (isPending) {
    return <b className="pending">{children}</b>;
  }
  // ...
}
```

##### 避免不必要的加载指示器

在这个例子中 PostsTab组件通过use获取了一些数据 当你点击“Posts” 选项卡时 PostsTab组件将挂起 导致使用最近的加载中后备方案

```jsx
// App.js
import { Suspense, useState } from 'react';
import TabButton from './TabButton.js';
import AboutTab from './AboutTab.js';
import PostsTab from './PostsTab.js';
import ContactTab from './ContactTab.js';

export default function TabContainer() {
  const [tab, setTab] = useState('about');
  return (
    <Suspense fallback={<h1>🌀 Loading...</h1>}>
      <TabButton
        isActive={tab === 'about'}
        action={() => setTab('about')}
      >
        About
      </TabButton>
      <TabButton
        isActive={tab === 'posts'}
        action={() => setTab('posts')}
      >
        Posts
      </TabButton>
      <TabButton
        isActive={tab === 'contact'}
        action={() => setTab('contact')}
      >
        Contact
      </TabButton>
      <hr />
      {tab === 'about' && <AboutTab />}
      {tab === 'posts' && <PostsTab />}
      {tab === 'contact' && <ContactTab />}
    </Suspense>
  );
}

// TabButton.js
export default function TabButton({ action, children, isActive }) {
  if (isActive) {
    return <b>{children}</b>
  }
  return (
    <button onClick={() => {
      action();
    }}>
      {children}
    </button>
  );
}
```

隐藏整个选项卡容器以显示加载指示符会导致用户体验不连贯 如果你将useTransition添加到TabButton中 你可以改为在选项卡中指示待处理状态

```jsx
import { useTransition } from 'react';

export default function TabButton({ action, children, isActive }) {
  const [isPending, startTransition] = useTransition();
  if (isActive) {
    return <b>{children}</b>
  }
  if (isPending) {
    return <b className="pending">{children}</b>;
  }
  return (
    <button onClick={() => {
      startTransition(async () => {
        await action();
      });
    }}>
      {children}
    </button>
  );
}
```

转换效果只会“等待”足够长的时间来避免隐藏 已经显示 的内容（例如选项卡容器）如果“帖子”选项卡具有一个嵌套`<Suspense>`边界 转换效果将不会“等待”它

##### 构建一个Suspense-enabled的路由

如果你正在构建一个React框架或路由 我们建议将页面导航标记为转换效果

```jsx
function Router() {
  const [page, setPage] = useState('/');
  const [isPending, startTransition] = useTransition();

  function navigate(url) {
    startTransition(() => {
      setPage(url);
    });
  }
  // ...
}
```

这么做有三个好处：

- 转换效果是可中断的 这样用户可以在等待重新渲染完成之前点击其他地方

- 转换效果可以防止不必要的加载指示符 这样用户就可以避免在导航时产生不协调的跳转

- Transition等待所有挂起的action 它允许用户在副作用完成之后再显示新页面

⚠️注意：

启用Suspense的路由默认情况下会将页面导航更新包装为 transition

##### 使用错误边界向用户显示错误

如果传递给startTransition的函数抛出错误 可以通过错误边界 error boundary 向用户显示错误 要使用错误边界 请将调用useTransition的组件包裹在错误边界中 当传递给startTransition的函数报错时 错误边界的备用UI将会显示

```jsx
import { useTransition } from "react";
import { ErrorBoundary } from "react-error-boundary";

export function AddCommentContainer() {
  return (
    <ErrorBoundary fallback={<p>⚠️Something went wrong</p>}>
      <AddCommentButton />
    </ErrorBoundary>
  );
}

function addComment(comment) {
  // For demonstration purposes to show Error Boundary
  if (comment == null) {
    throw new Error("Example Error: An error thrown to trigger error boundary");
  }
}

function AddCommentButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          // Intentionally not passing a comment
          // so error gets thrown
          addComment();
        });
      }}
    >
      Add comment
    </button>
  );
}
```

⚠️注意：

不应将控制输入框的状态变量标记为transition

```jsx
const [text, setText] = useState('');
// ...
function handleChange(e) {
  // ❌ 不应将受控输入框的状态变量标记为 Transition
  startTransition(() => {
    setText(e.target.value);
  });
}
// ...
return <input value={text} onChange={handleChange} />;
```

这是因为 Transition 是非阻塞的 但是在响应更改事件时更新输入应该是同步的 如果想在输入时运行一个 transition 那么有两种做法

1. 声明两个独立的状态变量：一个用于输入状态（它总是同步更新） 另一个用于在 Transition 中更新 这样 便可以使用同步状态控制输入 并将用于 Transition 的状态变量（它将“滞后”于输入）传递给其余的渲染逻辑

2. 或者使用一个状态变量 并添加 useDeferredValue 它将“滞后”于实际值 并自动触发非阻塞的重新渲染以“追赶”新值

当你在 startTransition 函数内部使用 await 时 await 之后的状态更新不会被标记为 Transition 更新 你必须将每个 await 之后的状态更新再次包裹在 startTransition 调用中

```jsx
startTransition(async () => {
  await someAsyncFunction();
  // ✅ 在 startTransition **之后** 再 await
  startTransition(() => {
    setPage('/about');
  });
});
```