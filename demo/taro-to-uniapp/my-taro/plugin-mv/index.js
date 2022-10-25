const fs = require("fs-extra");
const path = require("path");

const acssReg = /pages\/(.*)\/index\.acss$/; // 是pages下样式文件
const jsReg = /\.js$/; // 是js文件

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

// 每个js文件内的路由 pages/开头的，改为taro/pages/
function replaceFileContent(assets, filename) {
  const { children, _value } = assets[filename];
  if (children) {
    let str;
    children.forEach((child) => {
      str = child._value ? child._value : child;
      str = str.replace(new RegExp(/pages\//, "g"), "taro/pages/");
      if (child._value) {
        child._value = str;
      } else {
        child = str;
      }
    });
  } else {
    assets[filename]._value = _value.replace(
      new RegExp(/pages\//, "g"),
      "taro/pages/"
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

    console.log("编译结束！");

    const rootPath = path.resolve(__dirname, "../..");
    const miniappPath = path.join(rootPath, "my-uniapp/dist/build/mp-alipay");
    const outputPath = path.resolve(__dirname, "../dist");
    const destPath = path.join(miniappPath, "taro");

    if (fs.existsSync(destPath)) {
      fs.removeSync(destPath);
    }
    fs.copySync(outputPath, destPath);

    console.log("拷贝结束！");
  });
};
