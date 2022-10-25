# <center>taro与uniapp混合开发 #
部门两边技术栈不一样，但是两边功能又要融合，时间又紧，怎么办呢。将taro react写法全部转成uniapp vue写法，耗人力不说，其中的逻辑还需要全部测过，简直费时费力费人。那么，有没有什么简便的方法能够迅速的完成taro和uniapp的融合呢？网上搜下，百度下，google下。。。。。似乎找不到好的方法啊。不死心，再找下，文档再仔细研读一下。居然还真有。taro提供了一种方式，能在原生项目中集成taro。那么，换位思考下，是不是taro也能在uniapp打包好的项目中进行融合呢？实践下来，是可以的，我们可以通过将taro项目作为一个完成的分包，接入到uniapp项目中。接下来，以支付宝小程序为例来讲解。

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
在taro项目中安装插件[@tarojs/plugin-indie](https://github.com/NervJS/taro-plugin-indie)
```
npm i @tarojs/plugin-indie --save-dev
```


使用插件

在 ```config/index.js```中配置该插件
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

打包完后，移动 Taro 项目的输出目录到原生项目内，这个，可以通过插件plugin-mv实现自动移动。

```plugin-mv/index.js```文件内容
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

将插件```plugin-mv```配置到```config/index.js```中
```
plugins: [
    path.join(process.cwd(), '/plugin-mv/index.js'),
    '@tarojs/plugin-indie'
  ],
```

该插件运行完后，可以在my-uniapp下的打包文件下看到taro文件夹，文件夹内的就是my-taro项目打包后的内容

## 三、 设置uniapp项目的分包配置

修改uniapp打包后的文件中的app.json文件。在这里，是在```my-uniapp/dist/build/mp-alipay/app.json```中配置分包
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
Taro 会将多个页面的公共样式进行提取，放置于common.acss 文件中， app.acss文件引用common.acss文件，但是taro项目作为分包使用，因此，app.acss无法作用于当前支付宝小程序的所有页面，会导致页面的公共样式丢失。解决办法也很简单，只要在插件配置，在打包的时候，自动对pages文件夹下所有的index.acss都引入app.acss 文件即可。

```plugin-mv/index.js```文件中添加以下代码：
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
原本taro项目中进行路由跳转，url都是以/pages为开头。合并到my-uniapp项目之后，因为文件夹结构变了，打包的所有内容，都放在了taro文件夹下，因此，跳转也需要在前面加上/taro前缀，否则会导致所有跳转都失效。对所有js文件中的路由统一加上/taro前缀问题，可通过在taro插件中配置实现。

```plugin-mv/index.js```文件中添加以下代码：
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

### plugin-mv/index.js文件完整内容
```
const fs = require('fs-extra');
const path = require('path');

const acssReg = /pages\/(.*)\/index\.acss$/; // 是pages下样式文件
const jsReg = /\.js$/; // 是js文件

// 每个样式文件插入公用样式
function insertContentIntoFile(assets, filename) {
  let path = '../../app.acss';
  const arr = filename.split('/');
  if (arr.length - 1 > 2) {
    const num = arr.length - 3;
    for (let i = 0; i < num; i++) {
      path = '../' + path;
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
      const isPageAcss = acssReg.test(filename);
      const isJsFile = jsReg.test(filename);
      if (isPageAcss) {
        // 处理样式问题
        insertContentIntoFile(assets, filename);
      }
      if (isJsFile) {
        // 处理js文件中的路由问题
        replaceFileContent(assets, filename);
      }
    });
  });

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

