### useLayoutEffect

useLayoutEffect可能会影响性能 尽可能使用useEffect

useLayoutEffect是useEffect的一个版本 在浏览器重新绘制屏幕之前触发

```jsx
useLayoutEffect(setup, dependencies?)
```

参数：

setup：处理副作用的函数 setup函数选择性返回一个清理cleanup函数 在将组件首次添加到DOM之前 React将运行setup函数 在每次因为依赖项变更而重新渲染后 React将首先使用旧值运行cleanup函数（如果你提供了该函数）然后使用新值运行setup函数 在组件从DOM中移除之前 React将最后一次运行cleanup函数

可选dependencies：setup代码中引用的所有响应式值的列表 响应式值包括props、state以及所有直接在组件内部声明的变量和函数 如果忽略此函数 则在每次重新渲染组件之后 将重新运行setup函数

```jsx
import { useState, useRef, useLayoutEffect } from 'react';

function Tooltip() {
  const ref = useRef(null);
  const [tooltipHeight, setTooltipHeight] = useState(0);

 // 调用 useLayoutEffect 在浏览器重新绘制屏幕之前进行布局测量
  useLayoutEffect(() => {
    const { height } = ref.current.getBoundingClientRect();
    setTooltipHeight(height);
  }, []);
  // ...
}
```

#### 注意事项

useLayoutEffect返回undefined

1. useLayoutEffect是一个Hook 因此只能在组件的顶层或自己的Hook中调用它 不能在循环或条件内部调用它 如果你需要的话 抽离出一个组件并将副作用处理移动到那里

2. 当StrictMode启用时 React将在真正的setup函数首次运行前 运行一个额外的开发专有的setup+cleanup周期 这是一个压力测试 确保cleanup逻辑映照到setup逻辑 并停止或撤销setup函数正在做的任何事情

3. 如果你的一些依赖项是组件内部定义的对象或函数 则存在这样的风险 即它们将导致Effect重新运行的次数多于所需的次数 要解决这个问题 请删除不必要的对象和函数依赖项 你还可以抽离状态更新和非响应式逻辑到Effect之外

4. Effect只在客户端上运行 在服务端渲染中不会运行

5. useLayoutEffect 内部的代码和所有计划的状态更新阻塞啦浏览器重新绘制屏幕 如果过度使用 这会使你的应用程序变慢 尽量选择useEffect

6. 如果你在useLayoutEffect内部触发状态更新 React将立即执行所有剩余的Effects 包括useEffect

#### 使用方法

##### 在浏览器重新绘制屏幕前计算布局

大多数组件不需要依靠它们在屏幕上的位置和大小来决定渲染什么 他们只返回一些JSX 然后浏览器计算他们的布局（位置和大小）并重新绘制屏幕

但像tooltip组件 如果有足够的空间 tooltip应该出现在元素的上方 但如果不合适 它应该出现在下面 为了让tooltip渲染在最终正确的位置 你需要知道它的高度（即它是否合适放在顶部）

要做到这一点 你需要分两步渲染

1. 将tooltip渲染到任何地方（即使位置不对）

2. 测量它的高度并决定放置tooltip的位置

3. 把tooltip渲染放在正确的位置

所有这些都需要在浏览器重新绘制屏幕之前完成 你不希望用户看到tooltip在移动 调用useLayouteffect在浏览器重新绘制屏幕之前执行布局测量

```jsx
function Tooltip() {
  const ref = useRef(null);
  const [tooltipHeight, setTooltipHeight] = useState(0); // 你还不知道真正的高度

  useLayoutEffect(() => {
    const { height } = ref.current.getBoundingClientRect();
    setTooltipHeight(height); // 现在重新渲染，你知道了真实的高度
  }, []);

  // ... 在下方的渲染逻辑中使用 tooltipHeight ...
}
```

1. Tooltip使用初始值tooltipHeight=0进行渲染（因此tooltip可能被错误地放置）

2. React将它放在DOM中 然后进行useLayoutEffect中的代码

3. useLayoutEffect测量了tooltip内容的高度 并立即触发重新渲染

4. 使用实际的tooltipHeight再次渲染Tooltip（这样tooltip的位置就正确了）

5. React在DOM中对它进行更新 浏览器最终显示出tooltip

注意 即使Tooltip组件需要两次渲染（首先 使用初始值为0的tooltipHeight渲染 然后使用实际测量的高度渲染）你也只能看到最终结果 因为useLayoutEffect会阻塞浏览器渲染

注意：两次渲染并阻塞浏览器绘制会影响性能 尽量避免这种情况

useLayoutEffect的目的是让你的组件使用布局信息来渲染：

1. 渲染初始的内容

2. 在浏览器重新绘制屏幕之前测量布局

3. 使用所读取的布局信息渲染最终内容

当你或你的框架使用服务端渲染时 你的React应用将在服务端渲染HTML以进行初始渲染 这使你可以在加载JavaScript代码之前显示初始的HTML

如果遇到useLayoutEffect在服务端没有作用 有几种选择

1. 用useEffect替换useLayoutEffect React可以在不阻塞绘制的情况下显示最初的渲染结果（因为初始的HTML将在Effect运行之前显示出来）

2. 将你的组件标记为仅在客户端上渲染 这告诉React在服务器渲染期间将其内容替换为最接近的`<Suspense>`处的表示加载中的后备方案

3. 只有在激活之后 使用useLayoutEffect渲染组件 保留一个初始化为false的isMounted布尔状态 并在useEffect调用中将其设置为true 然后你的渲染逻辑就会像`return isMounted ? <RealContent /> : <FallbackContent />` 这样 在服务端和激活过程中 用户将看到FallbackContent 它不应该调用useLayoutEffect 然后 React将用RealContent替换它 RealContent仅在客户端上运行并且可以包含 useLayoutEffect 调用

4. 如果你将组件与外部数据存储同步 并且依赖useLayouteffect的原因不同于测量布局 可以考虑使用支持服务端渲染的useSyncExternalStore


