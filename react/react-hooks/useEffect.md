### useEffect

#### 参数

useEffect(setup, dependencies?)  返回值是 undefined

`setup` 处理 Effect 的函数 setup 选择性返回一个清理（cleanup）函数 当组件被添加到 DOM 时 React 将运行 setup 函数 在每次依赖项变更重新渲染后 React 将首先使用旧值运行 cleanup 函数（如果你提供了该函数）然后使用新值运行 setup 函数 当组件从 DOM 中移除后 React 将最后一次运行 cleanup 函数

`dependencies` 可选参数 setup 代码中引用的所有响应式值的列表 响应式值包括 props、state 以及所有直接在组件内部声明的变量和函数 依赖项列表的元素数量必须是固定的 并且必须像 [dep1, dep2, dep3] 这样内联编写 React 将使用 Object.is 来比较每个依赖项和它先前的值 如果忽略此参数 则每次重新渲染组件后 将重新运行 Effect 函数


#### 注意事项

`useEffect` 是一个 Hook 因此只能在组件的顶层 或者自己的 Hook 中调用它 而不能在循环或条件内部调用 如果需要 抽离出一个新组件并将 state 移入其中


当严格模式启动时 React 将在真正的 setup 函数首次运行之前 运行一个开发模式下专有的额外 setup + cleanup 周期 这是一个压力测试 用于确保 cleanup 逻辑映射到了 setup 逻辑 并能停止或撤销 setup 函数正在做的任何事情

如果你的一些依赖项是组件内部定义的对象或函数 则存在这样的风险 他们会导致 Effect 过多的重新执行 要解决这个问题 请删除不必要的 对象 和 函数 依赖项目 还可以抽离状态更新和非响应式的逻辑到 Effect 之外

如果你的 Effect 不是由交互（比如点击）引起的 那么 React 会让浏览器在运行 Effect 前先绘制出更新后的屏幕 如果你的 Effect 正在做一些视觉相关的事情（例如 定位一个 tooltip）并且有显著的延迟（例如 它会闪烁）那么将 useEffect 替换为 useLayoutEffect

如果你的 Effect 是由一个交互（比如点击）引起的 那么 React 可能会在浏览器重新绘制屏幕之前执行 Effect 通常情况下 这样是符合预期的 但是如果你必须推迟 Effect 执行到浏览器绘制之后 和使用 alert() 类似 可以使用 setTimeout

即使你的 Effect 是由一个交互（比如点击）引起的 React 也可能允许浏览器在处理 Effect 内部的状态更新之前重新绘制屏幕 通常这样是符合预期的 但如果你一定要阻止浏览器重新绘制屏幕 则需要用 useLayoutEffect 替换 useEffect

Effect 只在客户端上运行 在服务端渲染中不会运行

#### 用法

##### 连接到外部系统

有些组件需要与网络、某些浏览器 API 或第三方库保持连接 当他们显示在页面上时 这些系统不受 React 限制 所以称为外部系统

要将组件连接到某个外部系统 请在组件的顶层调用 useEffect

