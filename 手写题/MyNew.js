function myNew(constructor, ...args) {
  // 检查 constructor 是否为函数
  if (typeof constructor !== 'function') {
    throw new TypeError('constructor must be a function');
  }

  // 1. 创建一个新对象，并将其原型指向构造函数的 prototype
  const obj = Object.create(constructor.prototype);

  // 2. 调用构造函数，将 this 绑定到新创建的对象
  const result = constructor.apply(obj, args);

  // 3. 如果构造函数返回了一个对象，则返回该对象
  // 否则返回新创建的对象
  return result instanceof Object ? result : obj;
}
