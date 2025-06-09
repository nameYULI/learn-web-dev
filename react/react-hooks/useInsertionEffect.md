### useInsertionEffect

useInsertionEffect是为Css-in-JS库设计的 除非你正在使用Css-in-JS库 否则你应该使用useEffect或useLayoutEffect

useInsertionEffect可以在布局副作用触发之前将元素插入到DOM中

```jsx
useInsertionEffect(setup, dependencies?)
```

参数：

setup：处理Effect的函数 setup函数选择性返回一个清理cleanup函数 当你的组件添加到DOM中 但在任何布局触发之前 React将运行你的setup函数 在每次重新渲染时 如果依赖项发生变化并且提供了cleanup函数 React首先会使用旧值运行cleanup函数 然后使用新值运行你的setup函数 当你的组件从DOM中移除时 React将运行你的cleanup函数


可选dependencies：setup代码中所引用的所有响应式值的列表 响应式值包括props、state以及所有直接在组件内部声明的变量和函数 如果忽略此参数 则将在每次重新渲染组件之后重新运行Effect

注意：

useInsertionEffect返回undefined

1. Effect只在客户端运行 在服务器渲染期间不会运行

2. 你不能在useInertionEffect内部更新状态

3. 当useInsertionEffect运行时 refs还未附加

4. useInertionEffect可能在DOM更新之前或之后运行 你不应该依赖于DOM在任何特定时间的更新状态

5. 与其他类型的Effect不同 它们会先为每个Effect触发cleanup函数 然后再触发setup函数 而useInsertionEffect会同时出发cleanup和setup函数 这会当之cleanup函数和setup函数的“交错”执行

#### 使用方法

##### 从Css-in-JS库中注入动态样式

有些团队更喜欢直接在JavaScript代码中编写样式 而不是编写CSS文件 这通常需要使用CSS-in-JS库或工具 常见使用方法如下

1. 使用编译器静态提取到CSS文件

2. 内联样式 例如 <div style={{ color: 'red' }}>

3. 运行时注入`<style>`标签

如果你使用CSS-in-JS 建议结合使用前两种方法（静态样式使用CSS文件 动态样式使用内联样式）

不建议运行时注入`<style>`标签的原因如下

1. 运行时注入会使浏览器频繁地重新计算样式

2. 如果在React生命周期中某个错误的时机进行运行时注入 它可能会非常慢

第一个问题无法解决 useInsertionEffect可以解决第二个问题

```jsx
// 在你的 CSS-in-JS 库中
let isInserted = new Set();
function useCSS(rule) {
  useInsertionEffect(() => {
    // 同前所述，我们不建议在运行时注入 <style> 标签。
    // 如果你必须这样做，那么应当在 useInsertionEffect 中进行。
    if (!isInserted.has(rule)) {
      isInserted.add(rule);
      document.head.appendChild(getStyleForRule(rule));
    }
  });
  return rule;
}

function Button() {
  const className = useCSS('...');
  return <div className={className} />;
}
```

这与在渲染期间或useLayoutEffect中注入样式不同

如果你在渲染期间注入样式并且React正在处理非阻塞更新 那么浏览器将在渲染组件树时每一帧都会重新计算样式 这可能会非常慢

useInsertionEffect比在useLayoutEffect或useEffect期间注入样式更好 因为它会确保`<style>`标签在其他Effect运行前被注入 否则 正常的Effect中的布局计算将由于过时的样式而出错
