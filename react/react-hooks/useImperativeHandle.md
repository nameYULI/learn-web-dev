### useImperativeHandle

能让你自定义由ref暴露出来的句柄

```jsx
useImperativeHandle(ref, createHandle, dependencies?)
```

在组件顶层通过调用useImperativeHandle来自定义ref暴露出来的句柄

```jsx
import { useImperativeHandle } from 'react';

function MyInput({ ref }) {
  useImperativeHandle(ref, () => {
    return {
      // ... 你的方法 ...
    };
  }, []);
  // ...
}
```

参数：

ref: 该ref是你从MyInput组件中的prop中提取的参数

createHandle: 该函数无需参数 它返回你想要暴露的ref的句柄 该句柄可以包含任何类型 通常 你会返回一个包含你想暴露的方法对象

可选dependencies: 函数createHandle代码中所用到的所有反应式的值的列表 反应式的值包含props、状态和其他所有直接在你组件体内声明的变量和函数


`useImperativeHandle` 返回 undefined

#### 使用方法

##### 向父组件暴露一个自定义的ref句柄

要在父元素中访问DOM节点 需要在节点上设置ref属性

```jsx
function MyInput({ ref }) {
  return <input ref={ref} />;
};
```

```jsx
import { useRef, useImperativeHandle } from 'react';

function MyInput({ ref }) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => {
    return {
      focus() {
        inputRef.current.focus();
      },
      scrollIntoView() {
        inputRef.current.scrollIntoView();
      },
    };
  }, []);

  return <input ref={inputRef} />;
};
```

```jsx
import { useRef } from 'react';
import MyInput from './MyInput.js';

export default function Form() {
  const ref = useRef(null);

  function handleClick() {
    ref.current.focus();
    // 下方代码不起作用，因为 DOM 节点并未被暴露出来：
    // ref.current.style.opacity = 0.5;
  }

  return (
    <form>
      <MyInput placeholder="Enter your name" ref={ref} />
      <button type="button" onClick={handleClick}>
        Edit
      </button>
    </form>
  );
}
```

假设你不想暴露出整个<input>DOM节点 但你想要它其中两个方法：focus和scrollIntoView 你可以使用useImperativeHandle来暴露一个句柄 它只返回你想要父组件去调用的方法

#### 注意

不要滥用ref 你应当仅在你没法通过prop来表达`命令式`行为的时候才使用ref：例如滚动到指定节点、聚焦某个节点、触发一次动画以及选择文本等等

如果可以通过prop实现 那就不应该使用ref