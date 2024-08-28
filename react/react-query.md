针对 React 应用的状态管理器

### useQuery 获取数据


1. 查询关键字

React Query 在内部基于查询关键字来管理查询缓存, 传递给 useQuery 的查询关键字必须是一个数组。可以是简单的仅有单个常量字符串的数组，也可以是包含许多嵌套对象及变量字符串的数组。只要数组的内容是可序列化的，并且对查询的数据来说它是唯一的，那它就是合法的

多个组件请求同一个 query 时只发出一个请求

2. 查询函数

查询函数可以是任何一个返回 Promise 的函数。返回的 Promise 应该解决数据或抛出错误

有需要的话，查询关键字可以传到查询函数中

```ts
function Todos({ status, page }) {
  const result = useQuery({
    queryKey: ["todos", { status, page }],
    queryFn: fetchTodoList,
  });
}

// 在查询函数中访问键值，状态和页面变量！
function fetchTodoList({ queryKey }) {
  const [_key, { status, page }] = queryKey;
  return new Promise();
}
```

`result` 对象会返回查询的信息：

- isLoading 即 status === 'loading' - 查询暂时还没有数据
- isError 即 status === 'error' - 查询遇到一个错误
- isSuccess 即 status === 'success' - 查询成功，并且数据可用
- error - 如果查询处于isError状态，则可以通过error属性获取该错误
- data - 如果查询处于isSuccess状态，则可以通过data属性获得数据


3. 配置项

常用参数配置

- staleTime 重新获取数据的时间间隔 默认0
- cacheTime 数据缓存时间 默认 1000 60 5 5分钟
- retry 失败重试次数 默认 3次 也可以根据失败原因自定义重试retry =（failureCount，error）=> ...
- refetchOnWindowFocus 窗口重新获得焦点时重新获取数据 默认 true
- refetchOnReconnect 网络重新链接
- refetchOnMount 实例重新挂载
- enabled 如果为“false”的话，“useQuery”不会触发，需要使用其返回的“refetch”来触发操作

如何全局设置默认参数
```ts
const queryClient = new QueryClient({
  defaultOptions: {
    /**
     * refetchOnWindowFocus 窗口获得焦点时重新获取数据
     * staleTime 过多久重新获取服务端数据
     * cacheTime 数据缓存时间 默认是 5 * 60 * 1000 5分钟
     */
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000,
      retry: 0,
    },
  },
});

// 也可以单独配置
const { isLoading, error, data, refetch } = useQuery({
    queryKey: ['todos'],
    queryFn: getList,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000,
    retry: 0,
    enabled: false,
});
```

4. 返回结果

- isLoading 或者status === 'loading' - 还在请求中
- isError 或者 status === 'error' - 请求报错了
- isSuccess 或者 status === 'success' - 请求成功了，并且 data 可以使用了

完整官方示例
```tsx
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

const getList = async (data: any) => {
  return request('/edge/mng/psi/v2/listPsiTasks', {
    method: 'POST',
    data,
  });
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  );
}

function Example() {
  const { isLoading, error, data } = useQuery({
    queryKey: ['todos'],
    queryFn: getList,
  });


  if (isLoading) return "Loading...";

  if (error) return "An error has occurred: " + error.message;

  if (!data) return <div>no data</div>;

  return (
    <div>
      {data.list.map((item: any) => {
        return <h1 key={item.id}>{item.taskName}</h1>;
      })}
    </div>
  );
}
```

#### queryKey 与缓存

- 如果是完全相同的请求，设置好完全相同的queryKey后，react query会自动帮我们做缓存工作
- 如果不是完全相同的请求，设置相同的queryKey后，可能会出现问题

[![react-query-1](1.gif)]

### networkMode 网络模式

1. online（默认值）

只有在联网的状态下才会进行查询或修改，一个查询呗启动时，如果因为没有网络连接而无法获取，它将始终保持在同样的 status（loading error success）。如果请求还没返回就离线了，online 模式会暂停重试机制，一旦重新联网，暂停的查询会继续，如果查询在暂停期间被取消了，那联网后也不会继续。

除了 `status` 外，`useQuery` 还会返回另一个状态属性：`fetchStatus`

- isFetching 即 fetchStatus === 'fetching' - 正在查询中
- isPaused 即 fetchStatus === 'paused' - 查询想要获取，但它被暂停了（比如突然断网了）
- fetchStatus === 'idle' - 该查询处于闲置状态

`status`告诉我们有关data的状态：有或者没有？
`fetchStatus`告诉我们有关queryFn的状态：在执行还是没在执行？

2. always

查询会忽略网络状态一直尝试获取

3. offlineFirst

React Query 将运行一次 queryFn，但随后暂停重试（离线状态下也会运行一次）

### 并行查询

1. 手动并行

并排使用任意数量的 useQuery 或者 useInfiniteQuery

```ts
function App () {
  // 下面的查询将自动地并行执行
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams });
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: fetchProjects });

}
```

2. 使用 useQueries 动态并行查询

```ts
function App({ users }) {
  const userQueries = useQueries({
    queries: users.map((user) => {
      return {
        queryKey: ["user", user.id],
        queryFn: () => fetchUserById(user.id),
      };
    }),
  });
}
```

### 依赖查询

依赖查询（或串行查询）取决于先前的查询结果。要实现这一点，只需使用enabled选项就可以告诉查询何时可以运行

```ts
// Get the user
const { data: user } = useQuery({
  queryKey: ["user", email],
  queryFn: getUserByEmail,
});

const userId = user?.id;

// Then get the user's projects
const {
  status,
  fetchStatus,
  data: projects,
  refetch,
} = useQuery({
  queryKey: ["projects", userId],
  queryFn: getProjectsByUser,
  // 直到`userId`存在，查询才会被执行
  enabled: !!userId,
});

// 也可以手动执行 refetch() 触发查询
```

### 重试查询

默认情况下，React Query 不会在请求失败后立即重试。按照标准，后退延迟将逐渐应用于每次重试
默认的 retryDelay 设置为以二的倍数递增（从1000ms开始），但不超过 30 秒

```ts
defaultOptions: {
  queries: {
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
},
```

### keepPreviousData 分页/滞后查询

- 请求新数据时，即使查询键值已更改，上次成功获取的数据仍可用
- 当新数据到达时，先前的数据将被无缝交换以显示新数据
- 可以使用isPreviousData来了解当前查询提供的是什么数据

### useInfiniteQuery 无限查询

```tsx
const getList = async (data: any) => {
  const { pageParam } = data;
  return request('/asset/mgmt/dataSource/page', {
    method: 'POST',
    data: {
      ...pageParam,
    },
  });
};

const {
  data,
  error,
  fetchNextPage,
  fetchPreviousPage,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  ...rest
} = useInfiniteQuery({
  queryKey: ['todos'], // 设置query的key，要求独一无二，以数组格式，可以提供多个key
  queryFn: getList, // 发起请求的函数
  initialPageParam: { current: 1, size: 2 },
  getNextPageParam: (lastPage) => {
    // 返回值决定了 hasNextPage 的值
    if (lastPage.current * 2 < lastPage.total) {
      return {
        size: 2,
        current: lastPage.current + 1,
      };
    }
  },
  // placeholderData: {
  //   pages: [{ records: [{ sourceName: 'hhhh', description: 'hhhh' }] }],
  //   pageParams: [{ current: 1, size: 2 }],
  // },
});

<div>
  {data.pages.map((group, i) => (
    <div key={i}>
      {group.records?.map((item: any) => {
        return (
          <h1 key={item.id}>
            {item.sourceName}-{item.description}
          </h1>
        );
      })}
    </div>
  ))}
</div>
```

### placeholderData 查询数据占位符

默认值 但不持久化

```tsx
const Example = () => {
  const { isLoading, error, data }: any = useQuery({
    queryKey: ['todos'],
    queryFn: getList,
    // placeholderData: { records: [{ id: 'xx', sourceName: 'hhhh', description: 'hhhh' }] },
     placeholderData: () => {
      // 使用 `todos1` 查询的数据作为这个todos查询的占位数据
      return queryClient
        .getQueryData(["todos1"])
        ?.find((d) => d.id === 'xxx');
    },
  });
  console.log('🚀 ~ Example3 ~ data:', data);

  if (isLoading) return 'Loading...';
  if (error) return 'An error has occurred: ' + error.message;
  if (!data) return <div>no data</div>;

  return (
    <div>
      {data.records?.map((item: any) => {
        return (
          <h1 key={item.id}>
            {item.sourceName}-{item.description}
          </h1>
        );
      })}
    </div>
  );
};

export default Example;
```

### initialData 初始化数据

initialData 保留在缓存中 不建议为此选项提供占位符

### prefetchQuery 预取数据

使用 queryClient.prefetchQuery 预取数据并存入缓存
使用 queryClient.setQueryData 手动设置或更新缓存

```ts
const prefetchTodos = async () => {
  // 该查询的结果将像普通查询一样被缓存
  await queryClient.prefetchQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });
};

queryClient.setQueryData(["todos"], todos);
```

### 查询取消 AbortSignal

```tsx
const getList = async (data: any) => {
  return request('/asset/mgmt/dataSource/page', {
    method: 'POST',
    data,
    signal: data.signal,
  });
};
queryClient.cancelQueries({
  queryKey: ['todos'],
});
```

### useMutation 修改数据

与 query 不同 mutation 主要用来更新数据

```tsx
const { isLoading, error, data } = useQuery({
  queryKey: ['todos'],
  queryFn: getList,
});

// 定义修改数据
const mutation = useMutation({
  mutationFn: postList,
  onMutate: (variables) => {
    // 在调用mutationFn前会执行此函数
  },
  onError: (error, variables, context) => {
    // mutationFn 执行失败
  },
  onSuccess: (_: any, variables: any) => {
    // mutationFn 执行成功
    // 主动标识缓存失效 以重新请求列表数据
    queryClient.invalidateQueries({
      queryKey: ['todos'],
    });
    // 也可以执行“乐观”更新
    queryClient.setQueryData(["todos"], (old) => [...old, variables]);
  },
  onSettled: (data, error, variables, context) => {
    // 不管 mutationFn 执行成功还是失败，都会调用这个
  }
});

<Button
  onClick={() => {
    // 更新数据操作
    mutation.mutate({/** 传参 */});
  }}
>
  Create Todo
</Button>
```

除了在 useMutation 的时候提供这些回调配置，还可以在具体调用 mutate 的时候提供

```tsx
<Button
  onClick={() => {
    // 更新数据操作
    mutation.mutate({/** 传参 */},{ onSuccess: (data, variables, context) => {} /** ... */ });
  }}
>
  Create Todo
</Button>
```

useMutation 在失败后默认不会重试，但是可以自行配置重试次数

```tsx
const mutation = useMutation({
  mutationFn: addTodo,
  retry: 3,
})

```
