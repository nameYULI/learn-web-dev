
`MutationObserver`接口提供了监视对DOM树所做更改的能力 它被设计为旧的Mutation Events功能的替代品 该功能是DOM3 Events规范的一部分

`MutationObserver()`构造函数创建并返回一个新的`MutationObserver` 它会在指定的DOM发生变化时被调用

#### 方法

`disconnect()` 阻止MutationObserver实例继续接收的通知 直到再次调用其`observe()`方法 该观察者对象包含的回调函数都不会再被调用

`observe()` 配置MutationObserver在DOM更改匹配给定选项时 通过其回调函数开始接收通知

`takeRecords()` 从MutationObserver的通知队列中删除所有待处理的通知 并将它们返回到MutationRecord对象的新Array中

```js
// 选择需要观察变动的节点
const targetNode = document.getElementById("some-id");

// 观察器的配置（需要观察什么变动）
const config = { attributes: true, childList: true, subtree: true };

// 当观察到变动时执行的回调函数
const callback = function (mutationsList, observer) {
  // Use traditional 'for loops' for IE 11
  for (let mutation of mutationsList) {
    if (mutation.type === "childList") {
      console.log("A child node has been added or removed.");
    } else if (mutation.type === "attributes") {
      console.log("The " + mutation.attributeName + " attribute was modified.");
    }
  }
};

// 创建一个观察器实例并传入回调函数
const observer = new MutationObserver(callback);

// 以上述配置开始观察目标节点
observer.observe(targetNode, config);

// 之后，可停止观察
observer.disconnect();

```