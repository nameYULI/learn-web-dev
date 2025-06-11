### useOptimistic

useOptimistic是一个React Hook 它可以帮助你更乐观地更新用户界面

```jsx
const [optimisticState, addOptimistic] = useOptimistic(state, updateFn);
```

它允许你在进行异步操作时显示不同state 它接受state作为参数 并返回该state的副本 在异步操作（如网络请求）期间可以不同 你需要提供一个函数 该函数接受当前state和操作的输入 并返回在操作挂起期间要使用的乐观状态

这个状态被称为“乐观”状态是因此通常用于立即向用户呈现执行操作的结果 即使实际上操作需要一些时间来完成

```jsx
import { useOptimistic } from 'react';

function AppContainer() {
  const [optimisticState, addOptimistic] = useOptimistic(
    state,
    // 更新函数
    (currentState, optimisticValue) => {
      // 使用乐观值
      // 合并并返回新 state
    }
  );
}
```

参数：

state: 初始时和没有挂起操作时要返回的值

updateFn(currentState, optimisticValue): 一个函数 接受当前state和传递给addOptimistic的乐观值 并返回结果乐观状态 它必须是一个纯函数 updateFn接受两个参数: currentState和optimisticValue 返回值将是currentState和optimisticValue的合并结果

返回值：

optimisticState：结果乐观状态 除非有操作挂起 否则它等于state 在这种情况下 它等于updateFn返回的值

addOptimistic：触发乐观更新时调用的dispatch函数 它接受一个可以是任何类型的参数optimisticValue 并以state和optimisticValue作为参数来调用updateFn

#### 用法

##### 乐观地更新表单

useOptimistic Hook提供了一种在后台操作（如网络请求）完成之前乐观地更新用户界面的方式 在表单的上下文中 这种技术有助于使应用程序在感觉上响应地更加快速 当用户提交表单时 界面立即更新为预期的结果 而不是等待服务器的响应来反映更改

例如 当用户在表单中输入消息并点击“发送”按钮时 useOptimistic Hook允许消息立即出现在列表中 并带有"发送中..."的标签 即使消息实际上还没有发送到服务器 这种“乐观”方法给人一种快速和响应灵敏的印象 然后表单在后台尝试真正发送消息 一旦服务器确认消息已收到 “发送中...”标签就会被移除

```jsx
import { useOptimistic, useState, useRef, startTransition } from "react";
import { deliverMessage } from "./actions.js";

function Thread({ messages, sendMessageAction }) {
  const formRef = useRef();
  function formAction(formData) {
    addOptimisticMessage(formData.get("message"));
    formRef.current.reset();
    startTransition(async () => {
      await sendMessageAction(formData);
    });
  }
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage) => [
      {
        text: newMessage,
        sending: true
      },
      ...state,
    ]
  );

  return (
    <>
      <form action={formAction} ref={formRef}>
        <input type="text" name="message" placeholder="你好！" />
        <button type="submit">发送</button>
      </form>
      {optimisticMessages.map((message, index) => (
        <div key={index}>
          {message.text}
          {!!message.sending && <small>（发送中……）</small>}
        </div>
      ))}
      
    </>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    { text: "你好，在这儿！", sending: false, key: 1 }
  ]);
  async function sendMessageAction(formData) {
    const sentMessage = await deliverMessage(formData.get("message"));
    startTransition(() => {
      setMessages((messages) => [{ text: sentMessage }, ...messages]);
    })
  }
  return <Thread messages={messages} sendMessageAction={sendMessageAction} />;
}

// actions.js
export async function deliverMessage(message) {
  await new Promise((res) => setTimeout(res, 1000));
  return message;
}
```

