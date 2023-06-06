都可以描述一个对象或者函数

interface 可以 extends， 但 type 是不允许 extends 和 implement 的，但是 type 缺可以通过交叉类型 实现 interface 的 extend 行为，并且两者并不是相互独立的，也就是说 interface 可以 extends type, type 也可以 与 interface 类型 交叉

type 可以声明基本类型别名，联合类型，元组等类型

type 语句中还可以使用 typeof 获取实例的 类型进行赋值

interface 能够声明合并
