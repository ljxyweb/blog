# <center>taro 与 uniapp 混合开发

部门两边技术栈不一样，但是两边功能又要融合，时间又紧，怎么办呢。将 taro react 写法全部转成 uniapp vue 写法，耗人力不说，其中的逻辑还需要全部测过，简直费时费力费人。那么，有没有什么简便的方法能够迅速的完成 taro 和 uniapp 的融合呢？网上搜下，百度下，google 下。。。。。似乎找不到好的方法啊。不死心，再找下，文档再仔细研读一下。居然还真有。taro 提供了一种方式，能在原生项目中集成 taro。那么，换位思考下，是不是 taro 也能在 uniapp 打包好的项目中进行融合呢？实践下来，是可以的，我们可以通过将 taro 项目作为一个完成的分包，接入到 uniapp 项目中。接下来，以支付宝小程序为例来讲解（对应demo在demo/taro-to-uniapp）。

文件结构如下(部分文件未列出)：

```
|-- my-taro
    |-- config
        |-- index.js
    |-- dist(打包后的文件内容)
        |-- common.acss
    |-- plugin-mv
        |-- index.js
    |-- src
|-- my-uniapp
    |-- dist
        |-- build
            |-- mp-alipay(打包后的文件)
                |-- taro(my-taro项目打包后的文件)
                |-- app.json
```

## 一、 安装插件  

在 taro 项目中安装插件[@tarojs/plugin-indie](https://github.com/NervJS/taro-plugin-indie)

```
npm i @tarojs/plugin-indie --save-dev
```

使用插件

在 `config/index.js`中配置该插件

```
const config = {
  plugins: [
    '@tarojs/plugin-indie'
  ]
}
```

## 二、 配置命令

1.开发环境命令

```
"dev:alipay:uniapp": "taro build --type alipay --watch"
```

推荐在 Taro 项目中进行开发调试，在生产环境下再把产物移动到原生小程序中进行预览

2.生产环境命令

```
"build:alipay:uniapp": "taro build --type alipay --blended"
```

打包完后，移动 Taro 项目的输出目录到原生项目内，这个，可以通过插件 plugin-mv 实现自动移动。

`plugin-mv/index.js`文件内容

```
const fs = require('fs-extra');
const path = require('path');

export default (ctx, options) => {
  ctx.onBuildFinish(() => {
    // Taro v3.1.4
    const blended = ctx.runOpts.blended || ctx.runOpts.options.blended;

    if (!blended) return;

    console.log('编译结束！');

    const rootPath = path.resolve(__dirname, '../..');
    const miniappPath = path.join(rootPath, 'my-uniapp/dist/build/mp-alipay');
    const outputPath = path.resolve(__dirname, '../dist');
    const destPath = path.join(miniappPath, 'taro');

    if (fs.existsSync(destPath)) {
      fs.removeSync(destPath);
    }
    fs.copySync(outputPath, destPath);

    console.log('拷贝结束！');
  });
};
```

将插件`plugin-mv`配置到`config/index.js`中

```
plugins: [
    path.join(process.cwd(), '/plugin-mv/index.js'),
    '@tarojs/plugin-indie'
  ],
```

该插件运行完后，可以在 my-uniapp 下的打包文件下看到 taro 文件夹，文件夹内的就是 my-taro 项目打包后的内容

## 三、 设置 uniapp 项目的分包配置

修改 uniapp 打包后的文件中的 app.json 文件。在这里，是在`my-uniapp/dist/build/mp-alipay/app.json`中配置分包

```
"subPackages": [
    {
      "root": "taro",
      "pages": [
        "pages/index/index"
      ]
    }
  ],
```

基于上面的几个步骤，启动页基本是可以出来了。

## 四、 问题

1、 样式丢失问题：
Taro 会将多个页面的公共样式进行提取，放置于 common.acss  文件中， app.acss 文件引用 common.acss 文件，但是 taro 项目作为分包使用，因此，app.acss 无法作用于当前支付宝小程序的所有页面，会导致页面的公共样式丢失。解决办法也很简单，只要在插件配置，在打包的时候，自动对 pages 文件夹下所有的 index.acss 都引入 app.acss  文件即可。

`plugin-mv/index.js`文件中添加以下代码：

```
const acssReg = /pages\/(.*)\/index\.acss$/; // 是pages下样式文件

// 每个样式文件插入公用样式
function insertContentIntoFile(assets, filename) {
  let path = "../../app.acss";
  const arr = filename.split("/");
  if (arr.length - 1 > 2) {
    const num = arr.length - 3;
    for (let i = 0; i < num; i++) {
      path = "../" + path;
    }
  }
  // 根据文件层级结构，处理app.acss路径
  const content = `@import '${path}';\n`;
  const { children, _value } = assets[filename];
  if (children) {
    children.unshift(content);
  } else {
    assets[filename]._value = `${content}${_value}`;
  }
}

export default (ctx, options) => {
  ctx.modifyBuildAssets(({ assets }) => {
    const blended = ctx.runOpts.blended || ctx.runOpts.options.blended;

    if (!blended) return;

    Object.keys(assets).forEach((filename) => {
      const isPageAcss = acssReg.test(filename);
      if (isPageAcss) {
        // 处理样式问题
        insertContentIntoFile(assets, filename);
      }
    });
  });
};
```

2、 路由失效问题：
原本 taro 项目中进行路由跳转，url 都是以/pages 为开头。合并到 my-uniapp 项目之后，因为文件夹结构变了，打包的所有内容，都放在了 taro 文件夹下，因此，跳转也需要在前面加上/taro 前缀，否则会导致所有跳转都失效。对所有 js 文件中的路由统一加上/taro 前缀问题，可通过在 taro 插件中配置实现。

`plugin-mv/index.js`文件中添加以下代码：

```
const jsReg = /\.js$/; // 是js文件

// 每个js文件内的路由 pages/开头的，改为taro/pages/
function replaceFileContent(assets, filename) {
  const { children, _value } = assets[filename];
  if (children) {
    let str;
    children.forEach((child) => {
      str = child._value ? child._value : child;
      str = str.replace(new RegExp(/pages\//, 'g'), 'taro/pages/');
      if (child._value) {
        child._value = str;
      } else {
        child = str;
      }
    });
  } else {
    assets[filename]._value = _value.replace(
      new RegExp(/pages\//, 'g'),
      'taro/pages/'
    );
  }
}

export default (ctx, options) => {
  ctx.modifyBuildAssets(({ assets }) => {
    const blended = ctx.runOpts.blended || ctx.runOpts.options.blended;

    if (!blended) return;

    Object.keys(assets).forEach((filename) => {
      const isJsFile = jsReg.test(filename);
      if (isJsFile) {
        // 处理js文件中的路由问题
        replaceFileContent(assets, filename);
      }
    });
  });
};
```
