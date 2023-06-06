#### 优化开发体验

- 提升效率
- 优化构建速度
- 优化使用体验

#### 优化输出质量

- 优化要发线上的代码 减少用户能感知到的加载时间
- 提升代码性能 性能好 执行就快

#### 缩小文件范围 loader

- 优化 loader 配置
- test、include、exclude 三个配置项来缩小 loader 的处理范围
- 推荐 include

```js
module.exports = {
  rules: [
    {
      test: /\.css$/,
      include: path.resolve(__dirname, "./src"),
      use: ["style-loader", "css-loader"],
    },
    {
      test: /\.less$/,
      include: path.resolve(__dirname, "./src"),
      use: [
        // "style-loader",
        MiniCssExtractPlugin.loader,
        {
          loader: "css-loader",
          options: {
            //css modules 开启
            modules: true,
          },
        },
        {
          loader: "postcss-loader",
        },
        "less-loader",
      ],
    },
    {
      test: /\.(png|jpe?g|gif)$/,
      include: path.resolve(__dirname, "./src"),
      use: {
        loader: "url-loader",
        options: {
          name: "[name]_[hash:6].[ext]",
          outputPath: "images/",
          //推荐使用url-loader 因为url-loader支持limit
          //推荐小体积的图片资源转成base64
          limit: 12 * 1024, //单位是字节 1024=1kb
        },
      },
    },
    {
      test: /\.js$/,
      include: path.resolve(__dirname, "./src"),
      exclude: /node_modules/,
      use: {
        loader: "babel-loader",
      },
    },
  ],
};
```

#### 优化 resolve.modules

> resolve.modules 用于配制 webpack 去哪些目录下寻找第三方模块 默认是['node_modules'] 寻找第三方 默认是在当前目录下的 node_modules 里面去找 如果没有找到 就会去上一级目录../node_modules 找 再没有会去../../node_modules 中找 以此类推 和 Node.js 的模块寻找机制很类似 如果我们的第三方模块都安装在项目根目录下 就可以直接指明这个路径

```js
module.exports = {
  resolve: {
    modules: [path.resolve(__dirname, "./node_modules")],
  },
};
```

#### 优化 resolve.alias

resolve.alias 配置通过别名来将原导入路径映射成一个新的导入路径 拿 react 为例 我们引入的 react 为例 我们引入的 react 库 一般存在两套代码

- cjs
  采用 commonJS 规范的模块化代码
- umd
  已经打包好的完整代码 没有采用模块化 可以直接执行

默认情况下 webpack 会从入口文件./node_modules/bin/react/index 开始递归解析和处理依赖的文件 我们可以直接指定文件 避免这处的耗时

```js
module.exports = {
  resolve: {
    //查找第三方优化
    modules: [path.resolve(__dirname, "./node_modules")],
    alias: {
      "@": path.join(__dirname, "./src"),
      react: path.resolve(__dirname, "./node_modules/react/umd/react.production.min.js"),
      "react-dom": path.resolve(
        __dirname,
        "./node_modules/react-dom/umd/react-dom.production.min.js"
      ),
    },
  },
};
```

#### 优化 resolve.extensions

resolve.extensions 在导入语句没带文件后缀时 webpack 会自动带上后缀 去尝试查找文件是否存在

```js
module.exports = {
  resolve: {
    extensions: [".js", ".json", ".jsx", ".ts"];
  }
}
```

- 后缀尝试列表尽量的小
- 导入语句尽量带上后缀

#### 使用 externals 优化 cdn 静态资源

我们可以将一些 JS 文件存储在 CDN 上（减少 Webpack 打包出来的 js 体积）在 index.html 中通过 `<script>` 标签引入

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Document</title>
  </head>
  <body>
    <div id="root">root</div>
    <script src="http://libs.baidu.com/jquery/2.0.0/jquery.min.js"></script>
  </body>
</html>
```

我们希望在使用时 仍然可以通过 import 的方式去饮用（如 import $ from 'jquery'）并且希望 webpack 不会对其进行打包 此时就可以配置 externals

```js
//webpack.config.js
module.exports = {
  //...
  externals: {
    //jquery通过script引⼊之后，全局中即有了 jQuery 变量
    jquery: "jQuery",
  },
};
```

#### 使用静态资源路径 publicPath（CDN）

CDN 通过将资源部署到世界各地 使得用户可以就近访问资源 加快访问速度 要接入 CDN 需要把网页的静态资源上传到 CDN 服务上 在访问这些资源时 使用 CDN 服务提供的 URL

```js
// webpack.config.js
module.exports = {
  //...
  output: {
    publicPath: "//cdnURL.com", //指定存放JS⽂件的CDN地址
  },
};
```

使用条件

- 公司得有 cdn 服务器地址
- 确保静态资源文件的上传与否

#### 借助 MiniCssExtractPlugin 完成抽离 css

```js
// npm install mini-css-extract-plugin -D
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
module.exports = {
  //...
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [
          // "style-loader", // 不再需要style-loader，⽤MiniCssExtractPlugin.loader代替
          MiniCssExtractPlugin.loader,
          "css-loader", // 编译css
          "postcss-loader",
          "less-loader", // 编译less
        ],
      },
    ],
    plugins: [
      new MiniCssExtractPlugin({
        filename: "css/[name]_[contenthash:6].css",
        chunkFilename: "[id].css",
      }),
    ],
  },
};
```

#### 压缩 css

- 借助 optimize-css-assets-webpack-plugin
- 借助 cssnano

```js
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
module.exports = {
  //...
  module: {
    plugins: [
      new OptimizeCSSAssetsPlugin({
        cssProcessor: require("cssnano"), //引⼊cssnano配置压缩选项
        cssProcessorOptions: {
          discardComments: { removeAll: true },
        },
      }),
    ],
  },
};
```

#### 压缩 HTML

借助 html-webpack-plugin

```js
new htmlWebpackPlugin({
   title: "京东商城",
   template: "./index.html",
   filename: "index.html",
   minify: {
     // 压缩HTML⽂件
     removeComments: true, // 移除HTML中的注释
     collapseWhitespace: true, // 删除空⽩符与换⾏符
     minifyCSS: true // 压缩内联css
  }
 }),

```

#### 代码分割 code Splitting

**单页面应用 spa**

打包完后 所有页面只生成了一个 bundle.js

- 代码体积变大 不利于下载
- 代码没有合理利用浏览器资源

**多页面应用 mpa**

如果多个⻚⾯引⼊了⼀些公共模块 那么可以把这些公共的模块抽离出来 单独打包 公共代码只需要下载⼀次就缓存起来了 避免了重复下载

假如我们引⼊⼀个第三⽅的⼯具库 体积为 1mb ⽽我们的业务逻辑代码也有 1mb 那么打包出来的体积⼤⼩会在 2mb 这就会导致问题

- 文件体积⼤ 加载时间⻓
- 业务逻辑会变化 而第三⽅⼯具库不会 所以业务逻辑⼀变更 第三⽅⼯具库也要跟着变

```js
module.exports = {
  optimization: {
    splitChunks: {
      //缓存组
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all", // 所有的 chunks 代码公共的部分分离出来成为⼀个单独的⽂件
          maxSize: 5000000, //or whatever size you want
        },
      },
    },
  },
};
```

#### Scope Hoisting

作⽤域提升（Scope Hoisting）是指 webpack 通过 ES6 语法的静态分析 分析出模块之间的依赖关系 尽可能地把模块放到同⼀个函数中

通过配置 optimization.concatenateModules=true 开启 Scope Hoisting

通过 Scope Hoisting 的功能可以让 Webpack 打包出来的代码⽂件更⼩、运⾏的更快

```js
// webpack.config.js
module.exports = {
  module: {
    optimization: {
      concatenateModules: true,
    },
  },
};
```

#### DllPlugin 插件第三方类库 优化构建性能

Dll 动态链接库 其实就是做缓存

项⽬中引⼊了很多第三⽅库 这些库在很⻓的⼀段时间内 基本不会更新 打包的时候分开打包来提升打包速度 ⽽ DllPlugin 动态链接库插件 其原理就是把⽹⻚依赖的基础模块抽离出来打包到 dll ⽂件中
当需要导⼊的模块存在于某个 dll 中时 这个模块不再被打包 ⽽是去 dll 中获取

- 动态链接库只需要被编译⼀次 项⽬中⽤到的第三⽅模块 版本比较稳定 例如 react,react-dom 只要没有升级的需求 就可以使用

webpack 已经内置了对动态链接库的⽀持

- DllPlugin：⽤于打包出⼀个个单独的动态链接库⽂件
- DllReferencePlugin：⽤于在主要的配置⽂件中引⼊ DllPlugin 插件打包好的动态链接库⽂件

新建 webpack.dll.config.js ⽂件 打包基础模块

```js
const path = require("path");
const { DllPlugin } = require("webpack");

module.exports = {
  mode: "development",
  entry: {
    react: ["react", "react-dom"],
  },
  output: {
    path: path.resolve(__dirname, "./dll"),
    filename: "[name].dll.js",
    library: "react",
  },
  plugins: [
    new DllPlugin({
      // manifest.json⽂件的输出位置
      path: path.join(__dirname, "./dll", "[name]-manifest.json"),
      // 定义打包的公共vendor⽂件对外暴露的函数名
      name: "react",
    }),
  ],
};
```

在 package.json 中添加

```json
"dev:dll": "webpack --config ./webpack.dll.config.js"
```

- dll ⽂件包含了⼤量模块的代码 这些模块被存放在⼀个数组⾥ ⽤数组的索引号为 ID 通过变量将⾃⼰暴露在全局中 就可以在 window.xxx 访问到其中的模块
- Manifest.json 描述了与其对应的 dll.js 包含了哪些模块 以及 ID 和路径

```js
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");
const plugins = [new HardSourceWebpackPlugin()];
```

#### 使用 happypack 并发执行任务

```js
// npm i -D happypack
const HappyPack = require("happypack");
//构造出一个共享进程池，在进程池中包含5个子进程
var happyThreadPool = HappyPack.ThreadPool({ size: 5 });
module.exports = {
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            // ⼀个loader对应⼀个id
            loader: "happypack/loader?id=babel",
          },
        ],
      },
      {
        test: /\.css$/,
        include: path.resolve(__dirname, "./src"),
        use: ["happypack/loader?id=css"],
      },
    ],
    //在plugins中增加
    plugins: [
      new HappyPack({
        // ⽤唯⼀的标识符id，来代表当前的HappyPack是⽤来处理⼀类特定的⽂件
        id: "babel",
        // 如何处理.js⽂件，⽤法和Loader配置中⼀样
        loaders: ["babel-loader?cacheDirectory"],
        threadPool: happyThreadPool,
      }),
      new HappyPack({
        id: "css",
        loaders: ["style-loader", "css-loader"],
      }),
    ],
  },
};
```

#### 区分开发环境/生产环境

在 Webpack 中 开发环境和生产环境各有一个配置文件 在生产环境下 可以通过压缩代码、移除调试信息等方式减小文件大小 并且运行时的性能也会更好

可以通过设置 mode: 'production' 来切换到生产模式

#### 按需加载

将代码按需加载 只有当需要时才加载 可以减少首屏加载时间
可以使用 import() 或者 require.ensure 实现按需加载 Webpack 4.x 以上版本建议使用 import()

#### 利用缓存

利用浏览器缓存和 Webpack 缓存可以避免重复打包 提高构建速度

可以在 Webpack 配置文件中启用缓存：设置 cache: true 和 cacheDirectory 为 node_modules/.cache/babel-loader（如果使用了 Babel）

#### 懒加载图片
