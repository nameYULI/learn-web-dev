- 静态标记 + 非全量 Diff 在创建虚拟 DOM 树时 会根据 DOM 中的内容会不会发生变化 添加一个静态标记
- 在于上次虚拟节点进行对比的时候 只会对比这些带有静态标记的节点
- 使用最长递增子序列优化对比流程 可以最大程度减少 DOM 的移动 达到最少的 DOM 操作

#### 没有 key 的情况下

1. 比较新老 children 的 length 获取最小值 commonLen 作为公共部分
2. 老节点的数量大于新节点的数量？`unmountChildren` 公共部分之后的所有老节点
3. 新节点的数量大于老节点的数量？`mountChildren` 公共部分之后的所有新节点
4. 公共部分 依次 `patch`

#### 有 key 的情况下

1. diff 预处理

- 先从前往后比较 节点不同时 跳出循环 不再往后进行比较
- 从后往前进行比较 当节点不同时 跳出循环 不再往前进行比较

2. 经过预处理后 得出真正需要 diff 的差异部分 利用 `最长递增子序列` 完成差异部分的比较 提高 diff 效率

#### 同序列 + 挂载

- 两个循环结束/终止后 新的节点序列比旧的节点序列多 直接循环把多余的新增节点全部挂载到相应的位置
  - 旧队列 e1 < i 且 e2 >= i 那么只需要更新 e1 => i 间的节点即可
  - 找到当前节点后面的节点 e2+1 > l2(新序列长度) 向后插入 反之 向前插入

#### 同序列 + 卸载

- 两个循环结束/终止后 新的节点序列比旧的节点序列少 直接循环把多余的旧节点全部卸载
  - 旧队列 i > e2 且 i <= e1

#### 未知序列对比

当 i、e1、e2 不满足上述几种情形时 需要寻找其中需要被移除、新增的节点、需要移动的节点

1. 遍历 c1 中未进行处理的节点 查看 c2 中是否有对应的节点（key 相同） 若没有 则说明该节点已经被移除 执行 unmount 操作
2. 为了快速确认 c1 的节点在 c2 中是否有对应的节点以及所在的位置 对 c2 中的节点建立一个映射表 Map（key: index）
3. 基于 c2 中待处理的节点数目（toBePatched）创建一个变量 newIndexToOldIndexMap (Map< newIndex，oldIndex >)，用于存储新老节点序列未处理节点的索引对应关系
4. 遍历 c1 中待处理节点 先判断 pathed 是否大于 c2 中待处理的节点数目 toBePatched 当 patched > toBePatched 时 可以认为剩余 c1 中的节点都是多余的了 直接移除
5. 判断 c1、c2 中是否有相同 key 的节点存在

- 没有 直接 unmount 当前 c1 中的该节点
- 有 进行 patch 工作 更新 newIndexToOldIndexMap 中相应位置的值为该节点在 c1 中的索引 然后判断元素是否需要移动 最后更新 patched

6. 根据最长递增子序列算法求得最长递增子序列后 遍历 c2 中的待处理节点 判断节点是否属于新增 是否需要进行移动

```js
// 5. unknown sequence
// [i ... e1 + 1]: a b [c d e] f g
// [i ... e2 + 1]: a b [e d c h] f g
// i = 2, e1 = 4, e2 = 5
const s1 = i // prev starting index
const s2 = i // next starting index

// 5.1 build key:index map for newChildren
const keyToNewIndexMap: Map<string | number | symbol, number> = new Map()
for (i = s2; i <= e2; i++) {
  const nextChild = (c2[i] = optimized
    ? cloneIfMounted(c2[i] as VNode)
    : normalizeVNode(c2[i]))
  if (nextChild.key != null) {
    if (__DEV__ && keyToNewIndexMap.has(nextChild.key)) {
      warn(
        `Duplicate keys found during update:`,
        JSON.stringify(nextChild.key),
        `Make sure keys are unique.`
      )
    }
    keyToNewIndexMap.set(nextChild.key, i)
  }
}

// 5.2 loop through old children left to be patched and try to patch
// matching nodes & remove nodes that are no longer present
let j
let patched = 0
const toBePatched = e2 - s2 + 1
let moved = false
// used to track whether any node has moved
let maxNewIndexSoFar = 0
// works as Map<newIndex, oldIndex>
// Note that oldIndex is offset by +1
// and oldIndex = 0 is a special value indicating the new node has
// no corresponding old node.
// used for determining longest stable subsequence
const newIndexToOldIndexMap = new Array(toBePatched)
for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0

for (i = s1; i <= e1; i++) {
  const prevChild = c1[i]
  if (patched >= toBePatched) {
    // all new children have been patched so this can only be a removal
    unmount(prevChild, parentComponent, parentSuspense, true)
    continue
  }
  let newIndex
  if (prevChild.key != null) {
    newIndex = keyToNewIndexMap.get(prevChild.key)
  } else {
    // key-less node, try to locate a key-less node of the same type
    for (j = s2; j <= e2; j++) {
      if (
        newIndexToOldIndexMap[j - s2] === 0 &&
        isSameVNodeType(prevChild, c2[j] as VNode)
      ) {
        newIndex = j
        break
      }
    }
  }
if (newIndex === undefined) {
  unmount(prevChild, parentComponent, parentSuspense, true)
} else {
  newIndexToOldIndexMap[newIndex - s2] = i + 1
  if (newIndex >= maxNewIndexSoFar) {
    maxNewIndexSoFar = newIndex
  } else {
    moved = true
  }
  patch(
    prevChild,
    c2[newIndex] as VNode,
    container,
    null,
    parentComponent,
    parentSuspense,
    isSVG,
    slotScopeIds,
    optimized
  )
  patched++
}
}

// 5.3 move and mount
// generate longest stable subsequence only when nodes have moved
const increasingNewIndexSequence = moved
  ? getSequence(newIndexToOldIndexMap)
  : EMPTY_ARR
j = increasingNewIndexSequence.length - 1
// looping backwards so that we can use last patched node as anchor
for (i = toBePatched - 1; i >= 0; i--) {
  const nextIndex = s2 + i
  const nextChild = c2[nextIndex] as VNode
  const anchor =
    nextIndex + 1 < l2 ? (c2[nextIndex + 1] as VNode).el : parentAnchor
  if (newIndexToOldIndexMap[i] === 0) {
    // mount new
    patch(
      null,
      nextChild,
      container,
      anchor,
      parentComponent,
      parentSuspense,
      isSVG,
      slotScopeIds,
      optimized
    )
  } else if (moved) {
    // move if:
    // There is no stable subsequence (e.g. a reverse)
    // OR current node is not among the stable sequence
    if (j < 0 || i !== increasingNewIndexSequence[j]) {
      move(nextChild, container, anchor, MoveType.REORDER)
    } else {
      j--
    }
  }
}
```
