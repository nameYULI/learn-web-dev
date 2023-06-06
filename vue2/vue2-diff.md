- 只比较同层级
- 全量 Diff 数据发生变化 生成新的 DOM 树 并和之前的 DOM 树进行比较 找到不同的节点然后更新

- 当数据变化时 订阅者 watcher 就会调用 patch 给真实 DOM 打补丁
- 通过 sameVnode 进行判断 相同则调用 patchVnode 方法
- patchVnode 做了？
  - 找到对应的真实 dom 称为 el
  - 如果都有文本节点且不相等 将 el 文本节点设置为 Vnode 的文本节点
  - 如果 oldVnode 有子节点 而 Vnode 没有 则删除 el 子节点
  - 如果 oldVnode 没有子节点 而 Vnode 没有 则将 Vnode 的子节点真实化后添加到 el
  - 如果两者都有子节点 则执行 updateChildren 函数比较子节点
- updateChildren 做了？
  - 设置新旧节点的头尾指针
  - 新旧头尾指针进行比较（头尾均不相同？交叉对比 交叉均不同？循环旧子节点 获得 key-id Map 优先查找新子节点 key 不存在 key 则遍历旧队列通过 sameVnode 找出一致的节点） 循环向中间靠拢 根据情况调用 patchVnode 进行 patch

#### Virtual Dom --> VNode

```js
// VNode
export default class VNode {
  tag?: string
  data: VNodeData | undefined
  children?: Array<VNode> | null
  text?: string
  elm: Node | undefined
  ns?: string
  context?: Component // 在组件范围内被渲染
  key: string | number | undefined
  componentOptions?: VNodeComponentOptions
  componentInstance?: Component // 组件实例
  parent: VNode | undefined | null // 组件占位符节点

  // strictly internal
  raw: boolean // 包含原始的 HTML ? (仅限服务器)
  isStatic: boolean // 静态节点
  isRootInsert: boolean // necessary for enter transition check
  isComment: boolean // 空的注释占位符 ?
  isCloned: boolean // is a cloned node?
  isOnce: boolean // is a v-once node?
  asyncFactory?: Function // 异步组件工厂函数
  asyncMeta: Object | void
  isAsyncPlaceholder: boolean
  ssrContext?: Object | void
  fnContext: Component | void // 功能节点的真实环境视图
  fnOptions?: ComponentOptions | null // 用于SSR缓存
  devtoolsMeta?: Object | null // 用来存储devtools的功能渲染环境
  fnScopeId?: string | null // functional scope id support
  isComponentRootElement?: boolean | null // 用于SSR指令

  constructor(
    tag?: string,
    data?: VNodeData,
    children?: Array<VNode> | null,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.ns = undefined
    this.context = context
    this.fnContext = undefined
    this.fnOptions = undefined
    this.fnScopeId = undefined
    this.key = data && data.key
    this.componentOptions = componentOptions
    this.componentInstance = undefined
    this.parent = undefined
    this.raw = false
    this.isStatic = false
    this.isRootInsert = true
    this.isComment = false
    this.isCloned = false
    this.isOnce = false
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  get child(): Component | void {
    return this.componentInstance
  }
}
```

#### 判断两节点是否相同

1. `key` 相同
2. 异步组件：`asyncFactory` 相同
3. 同步组件：`tag/isComment/data` 相同；`input` 的 `type` 属性相同

```js
function sameVnode(a, b) {
  return (
    a.key === b.key &&
    a.asyncFactory === b.asyncFactory &&
    ((a.tag === b.tag &&
      a.isComment === b.isComment &&
      isDef(a.data) === isDef(b.data) &&
      sameInputType(a, b)) ||
      (isTrue(a.isAsyncPlaceholder) && isUndef(b.asyncFactory.error)))
  );
}
```

#### patchVnode 对比 oldVnode, vnode 进行 DOM 更新

1. 新节点是文本节点？ 直接更新 `DOM` 的文本内容
2. 新节点和旧节点都有子节点？ 调用 `updateChildren` 处理比较更新子节点
3. 只有新节点有子节点？创建出所有新的 `DOM` 并且添加进父节点
4. 只有旧节点有子节点？直接删除旧节点 `DOM`

```js
function patchVnode(oldVnode, vnode, insertedVnodeQueue, ownerArray, index, removeOnly?: any) {
  // step 1 当新旧节点一致时，不做修改直接返回
  if (oldVnode === vnode) {
    return;
  }
  // step 2 如果虚拟节点的 elm 属性存在的话，就说明有被渲染过了，如果 ownerArray 存在，说明存在子节点，如果这两点到成立，那就克隆一个 vnode 节点
  if (isDef(vnode.elm) && isDef(ownerArray)) {
    // clone reused vnode
    vnode = ownerArray[index] = cloneVNode(vnode); // isCloned = true
  }

  // 将 vnode.elm 引用到现在的真实 dom（oldVnode.elm）当 el 修改时 vnode.el 会同步变化
  const elm = (vnode.elm = oldVnode.elm);

  // step 3 如果是异步占位符，执行 hydrate 方法或者定义 isAsyncPlaceholder 为 true，然后退出
  if (isTrue(oldVnode.isAsyncPlaceholder)) {
    if (isDef(vnode.asyncFactory.resolved)) {
      hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
    } else {
      vnode.isAsyncPlaceholder = true;
    }
    return;
  }

  // reuse element for static trees.
  // note we only do this if the vnode is cloned -
  // if the new node is not cloned it means the render functions have been
  // reset by the hot-reload-api and we need to do a proper re-render.
  // step 4 如果满足以下四个条件，那就赋值一下 componentInstance 属性之后直接 return，说明整个组件没有任何变化，还是之前的实例
  // 1. vnode 是静态节点
  // 2. oldVnode 是静态节点
  // 3. key 属性都相等
  // 4. vnode 属于克隆的虚拟 DOM 或者是只渲染一次的组件（v-once）
  if (
    isTrue(vnode.isStatic) &&
    isTrue(oldVnode.isStatic) &&
    vnode.key === oldVnode.key &&
    (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
  ) {
    vnode.componentInstance = oldVnode.componentInstance;
    return;
  }

  // step 5 定义 data 常量，data 上一般是定义以下属性的，attrs 属性、on 事件、directives 指令、props、hook 钩子；这里调用 prepatch 的钩子函数
  let i;
  const data = vnode.data;
  if (isDef(data) && isDef((i = data.hook)) && isDef((i = i.prepatch))) {
    // 首先将 i.prepatch 赋值给 i 然后判断 i 是否被定义
    i(oldVnode, vnode);
  }

  // step 6 调用各种更新函数
  // updateAttrs 更新 attr 属性
  // updateClass 更新 class 属性
  // updateDOMListeners 更新绑定事件属性
  // updateDOMProps 更新 props 属性
  // updateStyle 更新 style 属性
  // update 如果 ref 属性存在，根据 ref 属性进行更新
  // updateDrectives 更新 Drectives 属性

  const oldCh = oldVnode.children;
  const ch = vnode.children;
  if (isDef(data) && isPatchable(vnode)) {
    for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
    if (isDef((i = data.hook)) && isDef((i = i.update))) i(oldVnode, vnode);
  }

  // step 7 判断是否存在 text 文本 如果不是文本节点或者注释节点
  if (isUndef(vnode.text)) {
    // 都有子节点
    if (isDef(oldCh) && isDef(ch)) {
      // step 7-1 子节点不完全一致 调用 updateChildren 函数更新
      if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly);
    } else if (isDef(ch)) {
      // 只有新的 vnode 有子节点
      // step 7-2 在非生产环境下检查是否有重复的 key，如果存在重复会提示
      if (__DEV__) {
        checkDuplicateKeys(ch);
      }
      // step 7-3 如果旧的 vnode 不存在子节点，但是存在 text 属性，新的 vnode 存在子集，那就把 Text 清空
      if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, "");
      // step 7-4 添加新的节点
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
    } else if (isDef(oldCh)) {
      // 如果只有旧的 vnode 有子节点 直接删除老的oldCh
      // step 7-5 移除子节点
      removeVnodes(oldCh, 0, oldCh.length - 1);
    } else if (isDef(oldVnode.text)) {
      // 如果旧节点是文本节点
      // step 7-6 设置显示文本为空
      nodeOps.setTextContent(elm, "");
    }
    // 如果新vnode和老vnode是文本节点或注释节点
    // 但是vnode.text != oldVnode.text时，只需要更新vnode.elm的文本内容就可以
  } else if (oldVnode.text !== vnode.text) {
    // step 8 设置显示文本为最新的值
    nodeOps.setTextContent(elm, vnode.text);
  }
  // step 9 执行 data.hook.postpatch 钩子，表明 patch 完毕
  if (isDef(data)) {
    if (isDef((i = data.hook)) && isDef((i = i.postpatch))) i(oldVnode, vnode);
  }
}
```

#### updateChildren

```js
function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
  // 初始化变量
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let oldKeyToIdx, idxInOld, vnodeToMove, refElm;

  // removeOnly is a special flag used only by <transition-group>
  // to ensure removed elements stay in correct relative positions
  // during leaving transitions
  // removeOnly 是一个特殊的标志，只被 <transition-group> 使用
  // 以确保被移除的元素在离开过渡期间保持正确的相对位置
  const canMove = !removeOnly;

  if (__DEV__) {
    checkDuplicateKeys(newCh);
  }

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (isUndef(oldStartVnode)) {
      // step 1 当前 oldStartVnode 为 undefined 或 null
      oldStartVnode = oldCh[++oldStartIdx]; // oldStartIdx 向右移动
    } else if (isUndef(oldEndVnode)) {
      // step 2 当前 oldEndVnode 为 undefined 或 null
      oldEndVnode = oldCh[--oldEndIdx]; // oldEndIdx 向左移动
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      // step 3 oldStartVnode 与 newStartVnode 节点一致，拷贝其实例，若存在子节点继续处理子节点
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
      oldStartVnode = oldCh[++oldStartIdx]; // oldStartIdx 向右移动
      newStartVnode = newCh[++newStartIdx]; // newStartIdx 向右移动
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // step 4 oldEndVnode 与 newEndVnode 节点一致，拷贝其实例，若存在子节点则继续处理子节点
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
      oldEndVnode = oldCh[--oldEndIdx]; // oldEndIdx 向左移动
      newEndVnode = newCh[--newEndIdx]; // newEndIdx 向左移动
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // step 5 交叉对比 oldStartVnode 与 newEndVnode 节点一致，拷贝其实例，若存在子节点则继续处理子节点
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
      // 如果可以移动 则将 oldStartVnode 对应真实节点右移到当前真实节点队列的末尾（当前 oldEndVnode 的后一个位置）
      canMove &&
        nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
      oldStartVnode = oldCh[++oldStartIdx]; // oldStartIdx 向右移动
      newEndVnode = newCh[--newEndIdx]; // newEndIdx 向左移动
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // step 6 交叉对比 oldEndVnode 与 newStartVnode 节点一致，拷贝其实例，若存在子节点则继续处理子节点
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
      // 如果可以移动 则将 oldEndVnode 对应真实节点左移到真实节点队列的首部（当前 oldStartVnode 的前一个位置）
      canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
      oldEndVnode = oldCh[--oldEndIdx]; // oldEndIdx 向左移动
      newStartVnode = newCh[++newStartIdx]; // newStartIdx 向右移动
    } else {
      // step 7 遍历旧 VD 队列 生成 key-id 的 Map
      if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      // step 8
      // 优先判断新 VD 是否存在 key
      // 存在 key 则直接使用 oldKeyToIdx 查找是否有 key 相同的节点
      // 不存在则调用 findIdxInOld 遍历旧 VD 队列通过 sameVnode 查找类型一致的 VD 对应的下标
      idxInOld = isDef(newStartVnode.key)
        ? oldKeyToIdx[newStartVnode.key]
        : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
      if (isUndef(idxInOld)) {
        // step 9 在旧 VD 中找不到一致的节点，说明是新节点，直接创建
        createElm(
          newStartVnode,
          insertedVnodeQueue,
          parentElm,
          oldStartVnode.elm,
          false,
          newCh,
          newStartIdx
        );
      } else {
        // 存在 key 值一致或者类型一致的节点
        vnodeToMove = oldCh[idxInOld];
        // 针对 key 值一样的节点，进一步判断节点类型是否一致
        if (sameVnode(vnodeToMove, newStartVnode)) {
          // step 10 key 一致且节点类型一致 拷贝其实例，若存在子节点则继续处理其子节点
          patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
          // 节点被使用，置为 undefined
          oldCh[idxInOld] = undefined;
          // 允许移动的话，则将找到的可复用旧节点移动到真实 Dom 队列的队首（当前 oldStartVnode 的前一个位置）
          canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
        } else {
          // step 11 key 一致，但是节点类型不一致，不可复用直接创建
          createElm(
            newStartVnode,
            insertedVnodeQueue,
            parentElm,
            oldStartVnode.elm,
            false,
            newCh,
            newStartIdx
          );
        }
      }
      newStartVnode = newCh[++newStartIdx]; // newStartIdx 向右移动
    }
  }
  // 循环结束
  // 若 oldStartIdx > oldEndIdx 说明旧 VD 队列遍历完了
  if (oldStartIdx > oldEndIdx) {
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
    // step 12 遍历余下新的 VD 并创建
    addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
  } else if (newStartIdx > newEndIdx) {
    // 若 newStartIdx > newEndIdx 说明新 VD 队列遍历完了
    // step 13 删除余下的旧 VD
    removeVnodes(oldCh, oldStartIdx, oldEndIdx);
  }
}
```

#### 在 patch 函数中执行 patchVnode

1. 没有新节点 直接触发旧节点的 `destroy` 钩子
2. 没有旧节点 说明是页面刚开始初始化的时候 此时 根本不需要比较了 直接全是新建 所以只调用 `createElm`
3. 通过 `sameVnode` 判断旧节点和新节点是否一样 一样时 调用 `patchVnode` 去处理这两个节点
4. 旧节点和新节点不一样 直接创建新节点 删除旧节点

```js
function patch(oldVnode, vnode, hydrating, removeOnly) {
  // 1. 没有新节点 直接执行 destory 钩子函数
  if (isUndef(vnode)) {
    if (isDef(oldVnode)) invokeDestroyHook(oldVnode);
    return;
  }

  let isInitialPatch = false;
  const insertedVnodeQueue: any[] = [];

  // 2. 没有旧节点 直接用新节点生成 dom 元素
  if (isUndef(oldVnode)) {
    // empty mount (likely as component), create new root element
    isInitialPatch = true;
    createElm(vnode, insertedVnodeQueue);
  } else {
    const isRealElement = isDef(oldVnode.nodeType); // 判断 oldVnode 是否是真实节点
    if (!isRealElement && sameVnode(oldVnode, vnode)) {
      // 3. 判断旧节点和新节点自身一样，一致执行patchVnode
      patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly);
    } else {
      // 4. 否则直接销毁及旧节点，根据新节点生成 dom 元素
      if (isRealElement) {
        // mounting to a real element
        // check if this is server-rendered content and if we can perform
        // a successful hydration.
        if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
          oldVnode.removeAttribute(SSR_ATTR);
          hydrating = true;
        }
        if (isTrue(hydrating)) {
          if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
            invokeInsertHook(vnode, insertedVnodeQueue, true);
            return oldVnode;
          } else if (__DEV__) {
            warn(
              "The client-side rendered virtual DOM tree is not matching " +
                "server-rendered content. This is likely caused by incorrect " +
                "HTML markup, for example nesting block-level elements inside " +
                "<p>, or missing <tbody>. Bailing hydration and performing " +
                "full client-side render."
            );
          }
        }
        // either not server-rendered, or hydration failed.
        // create an empty node and replace it
        oldVnode = emptyNodeAt(oldVnode);
      }

      // replacing existing element
      const oldElm = oldVnode.elm;
      const parentElm = nodeOps.parentNode(oldElm);

      // create new node
      createElm(
        vnode,
        insertedVnodeQueue,
        // extremely rare edge case: do not insert if old element is in a
        // leaving transition. Only happens when combining transition +
        // keep-alive + HOCs. (#4590)
        oldElm._leaveCb ? null : parentElm,
        nodeOps.nextSibling(oldElm)
      );

      // update parent placeholder node element, recursively
      if (isDef(vnode.parent)) {
        let ancestor = vnode.parent;
        const patchable = isPatchable(vnode);
        while (ancestor) {
          for (let i = 0; i < cbs.destroy.length; ++i) {
            cbs.destroy[i](ancestor);
          }
          ancestor.elm = vnode.elm;
          if (patchable) {
            for (let i = 0; i < cbs.create.length; ++i) {
              cbs.create[i](emptyNode, ancestor);
            }
            // #6513
            // invoke insert hooks that may have been merged by create hooks.
            // e.g. for directives that uses the "inserted" hook.
            const insert = ancestor.data.hook.insert;
            if (insert.merged) {
              // start at index 1 to avoid re-invoking component mounted hook
              for (let i = 1; i < insert.fns.length; i++) {
                insert.fns[i]();
              }
            }
          } else {
            registerRef(ancestor);
          }
          ancestor = ancestor.parent;
        }
      }

      // destroy old node
      if (isDef(parentElm)) {
        removeVnodes([oldVnode], 0, 0);
      } else if (isDef(oldVnode.tag)) {
        invokeDestroyHook(oldVnode);
      }
    }
  }

  invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
  return vnode.elm;
}
```
