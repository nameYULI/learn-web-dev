### display: none

1. DOM 结构：浏览器不会渲染 display 属性为 none 的元素 不占据空间
2. 事件监听：无法进行 DOM 事件监听
3. 性能：动态改变此属性会引起重排（回流） 性能较差
4. 继承：不会被子元素继承 子元素不会被渲染
5. transition：transition 不支持 display

### visibility: hidden

1. DOM 结构：元素被隐藏 但是会被渲染 占据空间
2. 事件监听：无法进行 DOM 事件监听
3. 性能：动态改变此属性会引起重绘 性能较高
4. 继承：会被子元素继承 子元素可以通过设置 visibility:visible 来取消隐藏
5. transition: visibility 会立即显示 隐藏时会延时

visibility: 离散步骤 在 0 到 1 数字范围之内 0 表示“隐藏” 1 表示完全“显示”
visibility : hidden; 可以看成 visibility : 0;
visibility : visible; 可以看成 visibility : 1;

只要 visibility 的值大于 0 就是显示的 所以 visibility:visible 过渡到 visibility:hidden 看上去不是平滑的过渡
而是进行了一个延时 而如果 visibility:hidden 过渡到 visibility:visible 则是立即显示 没有延时

### opacity: 0

1. DOM 结构：透明度为 100% 元素隐藏 占据空间
2. 事件监听：可以进行 DOM 事件监听
3. 性能：提升为合成层 不会触发重绘 性能较高（但如果不是合成层 依然会触发 repaint）
4. 继承：会被子元素继承 且子元素并不能通过 opacity: 1 来取消隐藏
5. transition: opacity 可以延时显示和隐藏

所以 visibility 和 display 属性是不会影响其他元素触发事件的 而 opacity 属性 如果遮挡住其他元素 其他的元素就不会触发事件了

**回流 reflow**

当页面中的一部分（或全部）因为元素的规模尺寸 布局 隐藏灯改变而需要重新构建 成为回流（也被称为重布局或重排）
每个页面至少需要一次回流 就是在页面第一次加载的时候

**重绘 repaint**

当页面中的一些元素需要更新属性 而这些属性只是影响元素的外观 风格 而不会影响布局的时候 如 background-color

元素提升为合成层后，transform 和 opacity 不会触发 repaint 如果不是合成层 则其依然会触发 repaint
在 Blink 和 WebKit 内核的浏览器中 对于应用了 transition 或者 animation 的 opacity 元素 浏览器会将渲染层提升为合成层
也可以使用 translateZ(0) 或者 translate3d(0,0,0) 来人为地强制性地创建一个合成层

**回流必将引起重绘 而重绘不一定会引起回流**
