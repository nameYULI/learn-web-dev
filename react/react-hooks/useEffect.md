### useEffect

#### 参数

useEffect(setup, dependencies?) 返回值是 undefined

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

```jsx
import { useState, useEffect } from 'react';
import { createConnection } from './chat.js';

function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234');

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => {
      connection.disconnect();
    };
  }, [serverUrl, roomId]);
  // ...
}
```

需要向 Effect 传递两个参数

1. 一个 setup 函数 其中 setup 代码用来连接到该系统

- 它应该返回一个清理函数 cleanup 其 cleanup 代码用来与该系统断开连接

2. 一个依赖项列表 包括这些函数使用的每个组件内的值

React 在必要时会调用 setup 和 cleanup 这可能会发生多次

1. 将组件挂载到页面时 将运行 setup 代码

2. 重新渲染`依赖项 `变更的组件后

- 首先 使用旧的 props 和 state 运行 cleanup 代码

- 然后 使用新的 props 和 state 运行 setup 代码

3. 当组件从页面卸载后 cleanup 代码将运行最后一次

注意： 在开发环境下 React 在运行 setup 函数之前会额外运行一次 setup 和 cleanup 这是一个压力测试 用于验证 Effect 逻辑是否正确实现 如果这会导致可见的问题 那么你的 cleanup 函数就缺少一些逻辑

cleanup 函数函数应该停止或撤销 setup 函数正在执行的任何操作 一般来说 用户不应该能够区分只调用一次 setup（在生产环境中）与调用 setup➡️ceanup➡️setup 序列（在开发环境中）

尽量将每个 Effect 作为一个独立的过程编写 并且每次只考虑一个单独的 setup/cleanup 周期 组件是否正在挂载、更新或卸载并不重要 当你的 cleanup 逻辑正确地映射到 setup 逻辑时 你的 Effect 是可复原的 因此可以根据需要多次运行 setup 和 cleanup 函数

注意：Effect 可以让你的组件与某些外部系统（如聊天服务）保持同步 外部系统是指任何不受 React 控制的代码 例如：

- 由 setInterval() 和 clearInterval() 管理的定时器
- 使用 window.addEventListener() 和 window.removeEventListener() 的事件订阅
- 一个第三方的动画库，它有一个类似 animation.start() 和 animation.reset() 的 API

如果你没有连接到任何外部系统，你或许不需要 Effect

##### 在自定义 Hook 中封装 Effect

Effect 是一种脱围机制 当你需要走出 React 之外 或者当你的使用场景没有更好的内置解决方案时 你可以使用它们 如果你发现自己经常需要手动编写 Effect 那么这通常表明你需要为组件所依赖的通用行为提取一些 `自定义 Hook`

例如 这个 useChatRoom 自定义 Hook 把 Effect 的逻辑隐藏在一个更具声明性的 API 之后：

```jsx
function useChatRoom({ serverUrl, roomId }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [serverUrl, roomId]);
}
```

然后你可以像这样从任何组件使用它

```jsx
function ChatRoom({ roomId }) {
  useChatRoom({
    serverUrl: 'https://localhost:1234',
    roomId: roomId,
  });
  // ...
}
```

##### 控制非 React 小部件

有时 你希望外部系统的某些 props 或 state 保持同步

例如 如果你有一个没有使用 React 编写的第三方地图小部件或视频播放器组件 你可以使用 Effect 调用该组件上的方法 使其状态与 React 组件的当前状态相匹配 此 Effect 创建了在 map-widget.js 中定义的 MapWidget 类的实例 当你更改 Map 组件的 zoomLevel prop 时 Effect 调用类实例上的 setZoom() 来保持同步

```jsx
// App.js
import { useState } from 'react';
import Map from './Map.js';

export default function App() {
  const [zoomLevel, setZoomLevel] = useState(0);
  return (
    <>
      Zoom level: {zoomLevel}x
      <button onClick={() => setZoomLevel(zoomLevel + 1)}>+</button>
      <button onClick={() => setZoomLevel(zoomLevel - 1)}>-</button>
      <hr />
      <Map zoomLevel={zoomLevel} />
    </>
  );
}

// Map.js
import { useRef, useEffect } from 'react';
import { MapWidget } from './map-widget.js';

export default function Map({ zoomLevel }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current === null) {
      mapRef.current = new MapWidget(containerRef.current);
    }

    const map = mapRef.current;
    map.setZoom(zoomLevel);
  }, [zoomLevel]);

  return (
    <div
      style={{ width: 200, height: 200 }}
      ref={containerRef}
    />
  );
}

// map-widget.js
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

export class MapWidget {
  constructor(domNode) {
    this.map = L.map(domNode, {
      zoomControl: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      scrollWheelZoom: false,
      zoomAnimation: false,
      touchZoom: false,
      zoomSnap: 0.1
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
    this.map.setView([0, 0], 0);
  }
  setZoom(level) {
    this.map.setZoom(level);
  }
}
```

在本例中 不需要 cleanup 函数 因为 MapWidget 类只管理传递给它的 DOM 节点 从树中删除 Map 组件后 DOM 节点和 MapWidget 类实例都将被浏览器的 JavaScript 引擎的垃圾回收机制自动处理掉

##### 使用 Effect 请求数据

你可以使用 Effect 来为组件请求数据 请注意 如果你使用框架 使用框架的数据请求方式将比在 Effect 中手动编写要有效得多

如果你想手动从 Effect 中请求数据 你的代码可能是这样的

```jsx
import { useState, useEffect } from 'react';
import { fetchBio } from './api.js';

export default function Page() {
  const [person, setPerson] = useState('Alice');
  const [bio, setBio] = useState(null);

  useEffect(() => {
    let ignore = false;
    setBio(null);
    fetchBio(person).then((result) => {
      if (!ignore) {
        setBio(result);
      }
    });
    return () => {
      ignore = true;
    };
  }, [person]);
}
```

注意 ignore 变量被初始化为 false 并且在 cleanup 中被设置为 true 这样可以确保你的代码不会收到“竞争条件”的影响：网络响应可能会以与你发送的不同的顺序到达

```jsx
import { useState, useEffect } from 'react';
import { fetchBio } from './api.js';

export default function Page() {
  const [person, setPerson] = useState('Alice');
  const [bio, setBio] = useState(null);
  useEffect(() => {
    let ignore = false;
    setBio(null);
    fetchBio(person).then((result) => {
      if (!ignore) {
        setBio(result);
      }
    });
    return () => {
      ignore = true;
      // 如果网络请求还没返回时 person就发生了变化 会先执行cleanup函数把ignore置为true
      // 这样上次的结果就不会更新state了
    };
  }, [person]);

  return (
    <>
      <select
        value={person}
        onChange={(e) => {
          setPerson(e.target.value);
        }}
      >
        <option value='Alice'>Alice</option>
        <option value='Bob'>Bob</option>
        <option value='Taylor'>Taylor</option>
      </select>
      <hr />
      <p>
        <i>{bio ?? 'Loading...'}</i>
      </p>
    </>
  );
}
```

在 Effect 中使用 fetch 是请求数据的一种流行方式 特别是在完全的客户端应用程序中 然而这是一种非常手动的方法 而且有很大的缺点

1. Effect 不在服务器上运行 这意味着初始服务器渲染的 HTML 将只会包含没有数据的 loading 状态 客户端电脑仅为了发现它现在需要加载数据 将不得不下载所有的脚本来渲染你的应用程序 这并不高效

2. 在 Effect 中直接请求数据很容易导致“网络瀑布” 当你渲染父组件时 它会请求一些数据 再渲染子组件 然后重复这样的过程来请求子组件的数据 如果网络不是很快 这将比并行请求所有数据要慢得多

3. 在 Effect 中直接请求数据通常意味着你不会预加载或缓存数据 例如 如果组件卸载后重新挂载 它不得不再次请求数据

4. 这不符合工效学 在调用 fetch 时 需要编写大量样板代码 以避免像竞争条件这样的 bug

推荐方法：

1. 考虑使用或构建客户端缓存 例如 使用 React Query 或 SWR 等库

##### 指定响应式依赖项

注意 你无法选择 Effect 的依赖项 Effect 代码汇总使用的每个响应式值都必须声明为依赖项 你的 Effect 依赖列表是由周围代码决定的

```jsx
function ChatRoom({ roomId }) {
  // 这是一个响应式值
  const [serverUrl, setServerUrl] = useState('https://localhost:1234'); // 这也是一个响应式值

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId); // 这个 Effect 读取这些响应式值
    connection.connect();
    return () => connection.disconnect();
  }, [serverUrl, roomId]); // ✅ 因此你必须指定它们作为 Effect 的依赖项
  // ...
}
```

如果 serverUrl 或 roomId 任意一个发生变化 那么 Effect 将使用新的值重新连接到聊天室

`响应式值`包括 props 和直接在组件内声明的所有变量和函数 由于 roomId 和 serverUrl 是响应式值 你不能将它们从依赖项中移除 如果你试图省略它们 并且你的代码检查工具针对 React 进行了正确的配置 那么代码检查工具会将它标记为需要修复的错误

```jsx
function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234');

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  }, []); // 🔴 React Hook useEffect 缺少依赖项：'roomId' 和 'serverUrl'
  // ...
}
```

要删除一个依赖项 你需要证明给代码检查工具 表明它不需要作为一个依赖项 例如你可以将 serverUrl 声明移动到组件外面 以证明它不是响应式的 并且不会在重新渲染时发生变化

```jsx
const serverUrl = 'https://localhost:1234'; // 不再是一个响应式值

function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // ✅ 所有声明的依赖项
  // ...
}
```

现在 serverUrl 不再是一个响应值（并且在重新渲染时也不会更改）它就不需要成为一个依赖项 如果 Effect 的代码不使用任何响应式值 则其依赖项列表为空 `[]`

```jsx
const serverUrl = 'https://localhost:1234'; // 不再是响应式值
const roomId = 'music'; // 不再是响应式值

function ChatRoom() {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  }, []); // ✅ 所有声明的依赖项
  // ...
}
```

依赖项为空数组的 Effect 不会在组件任何的 props 或 state 发生改变时重新运行 它仅在初始渲染后运行
（即使依赖项为空 setup 和 cleanup 函数也会在开发环境中额外多运行一次 以帮助你发现 bug）

注意：当依赖项不匹配代码时 引入 bug 的风险很高 通过抑制代码检查工具 你欺骗了 React 关于你 Effect 所依赖的值

```jsx
useEffect(() => {
  // ...
  // 🔴 避免这样抑制代码检查工具：
  // eslint-ignore-next-line react-hooks/exhaustive-deps
}, []); // 不会再次运行（开发环境下除外）
```

如果完全不传递依赖数组 则 Effect 会在组件的每次单独渲染和重新渲染之后运行

```jsx
useEffect(() => {
  // ...
}); // 总是再次运行
```

##### 在 Effect 中根据先前 state 更新 state

当你想要在 Effect 中根据先前 state 更新 state 时 可能会遇到问题

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCount(count + 1); // 你想要每秒递增该计数器...
    }, 1000);
    return () => clearInterval(intervalId);
  }, [count]); // 🚩 ... 但是指定 `count` 作为依赖项总是重置间隔定时器。
  // ...
}
```

因为 count 是一个响应式值 所以必须在依赖项列表中指定它 但是 这会导致 Effect 在每次 count 更改时再次执行 cleanup 和 setup 这并不理想

为了解决这个问题 将 c => c + 1 状态更新器传递给 setCount

```jsx
import { useState, useEffect } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCount((c) => c + 1); // ✅ 传递一个 state 更新器
    }, 1000);
    return () => clearInterval(intervalId);
  }, []); // ✅现在 count 不是一个依赖项

  return <h1>{count}</h1>;
}
// 现在你传递的是 c => c + 1 而不是count+1 因此Effect不需要依赖于count 由于这个修复 每次count更改时 它都不需要重新执行cleanup和setup
```

##### 删除不必要的对象依赖项

如果你的 Effect 依赖于在渲染期间创建的对象或函数 则它可能会频繁运行

```jsx
const serverUrl = 'https://localhost:1234';

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  const options = {
    // 🚩 这个对象在每次渲染时都是从头创建的
    serverUrl: serverUrl,
    roomId: roomId,
  };

  useEffect(() => {
    const connection = createConnection(options); // 它在 Effect 内部使用
    connection.connect();
    return () => connection.disconnect();
  }, [options]); // 🚩 因此，这些依赖在重新渲染时总是不同的
  // ...
}
```

避免使用渲染期间创建的对象作为依赖项 相反 应该在 Effect 内部创建对象

```jsx
const serverUrl = 'https://localhost:1234';

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const options = {
      serverUrl: serverUrl,
      roomId: roomId,
    };
    const connection = createConnection(options); // 它在 Effect 内部使用
    connection.connect();
    return () => connection.disconnect();
  }, []);
  // ...
}
```

##### 删除不必要的函数依赖项

如果你的Effect依赖于在渲染期间创建的对象或函数 则它可能会频繁运行

```jsx
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  function createOptions() { // 🚩 此函数在每次重新渲染都从头开始创建
    return {
      serverUrl: serverUrl,
      roomId: roomId
    };
  }

  useEffect(() => {
    const options = createOptions(); // 它在 Effect 中被使用
    const connection = createConnection();
    connection.connect();
    return () => connection.disconnect();
  }, [createOptions]); // 🚩 因此，此依赖项在每次重新渲染都是不同的
  // ...
}
```

就其本身而言 在每次重新渲染时从头新建一个函数不是问题 不需要优化它 但如果要把它作为Effect的依赖项 则会导致Effect在每次重新渲染后重新运行

避免使用在渲染期间创建的函数作为依赖项 请在Effect内部声明它

```jsx
import { useState, useEffect } from 'react';
import { createConnection } from './chat.js';

const serverUrl = 'https://localhost:1234';

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    function createOptions() {
      return {
        serverUrl: serverUrl,
        roomId: roomId
      };
    }

    const options = createOptions();
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);
}
```

##### 从Effect读取最新的props和state（useEffectEvent 实验性API）

有时想要从Effect中获取最新的props和state 但不响应他们 例如想记录每次页面访问时购物车中的商品数量

```jsx
function Page({ url, shoppingCart }) {
  useEffect(() => {
    logVisit(url, shoppingCart.length);
  }, [url, shoppingCart]); // ✅ 所有声明的依赖项
  // ...
}
```

如果你想在url更改后记录一次新的页面访问 而不是在shoppingCart更改后记录 你不能在违反响应规则的情况下将shoppingCart从依赖项中移除 然而你可以表达“不希望”某些代码对更改做出响应 即使是它在Effect内部调用的 使用useEffectEvent Hook声明Effect事件

```jsx
function Page({ url, shoppingCart }) {
  const onVisit = useEffectEvent(visitedUrl => {
    logVisit(visitedUrl, shoppingCart.length)
  });

  useEffect(() => {
    onVisit(url);
  }, [url]); // ✅ 所有声明的依赖项
  // ...
}
// Effect 事件不是响应式的 必须始终省略其作为Effect的依赖项 在其中放置非响应式代码（可以在其中读取某些props和state的最新值）
// 通过在onVisit中读取shoppingCart 确保了shoppingCart不会使Effect重新运行
```

##### 在服务器和客户端上显示不同的内容

如果你的应用程序使用服务端渲染（直接或通过框架）你的组件将会在两个不同的环境中渲染 在服务器上 它将渲染生成初始html 在客户端 React将再次运行渲染代码 以便将事件处理附加到该html上 这就是为什么要让hybration发挥作用 你的初始渲染输出必须在客户端和服务器上完全相同

在极少数情况下 你可能需要在客户端上显示不同的内容 例如 如果你的应用从localStorage中读取某些数据 服务器上肯定不可能做到这一点

```jsx
function MyComponent() {
  const [didMount, setDidMount] = useState(false);

  useEffect(() => {
    setDidMount(true);
  }, []);

  if (didMount) {
    // ... 返回仅客户端的 JSX ...
  }  else {
    // ... 返回初始 JSX ...
  }
}
```

当应用加载时 用户首先会看到初始渲染的输出 然后当它加载完并进行激活时 Effect将会运行并且将didMount设置为true 从而触发重新渲染 这将切换到仅在客户端的渲染输出 Effect不会在服务器上运行 didMount在初始服务器渲染期间为false

谨慎使用此模式 网络连接速度较慢的用户将在相当长的时间内（可能是数秒钟）看到初始内容 因此你不希望对组件的外观进行突兀的更改 在许多情况下 你可以通过使用CSS条件性地显示不同的内容来避免这种需要


注意：如果Effect一定要组织浏览器绘制屏幕 使用useLayoutEffect替换useEffect 绝大多数的Effect都不需要这样 只有当在浏览器绘制之前“运行Effect非常重要”的时候才需如此：例如 在用户看到tooltip之前测量并定位它