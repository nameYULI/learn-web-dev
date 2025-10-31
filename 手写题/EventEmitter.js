class EventEmitter {
  constructor() {
    this.events = {};
  }
  // 订阅事件, 注册回调
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    return this;
  }
  // 发布事件
  emit(eventName, ...args) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach((callback) => callback.apply(this, args));
    }
    return this;
  }
  // 取消订阅事件, 注销回调
  off(eventName, callback) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      this.events[eventName] = callbacks.filter((cb) => cb !== callback);
    }
    return this;
  }
  // 一次性订阅事件, 回调函数执行后自动取消订阅
  once(eventName, callback) {
    const onceCallback = (...args) => {
      callback.apply(this, args);
      this.off(eventName, onceCallback);
    };
    this.on(eventName, onceCallback);
    return this;
  }
}
