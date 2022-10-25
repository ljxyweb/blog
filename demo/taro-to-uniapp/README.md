## Demo - 把 Taro 项目作为uniapp项目中的一个分包单独使用

[详细文档](https://docs.taro.zone/docs/taro-in-miniapp#%E6%8A%8A-taro-%E9%A1%B9%E7%9B%AE%E4%BD%9C%E4%B8%BA%E4%B8%80%E4%B8%AA%E5%AE%8C%E6%95%B4%E5%88%86%E5%8C%85)

推荐在 Taro 项目中进行开发调试，在生产环境下再在uniapp中进行预览。
### 生产环境

#### 1. my-uniapp项目打包

```bash
$ yarn build:mp-alipay
```

#### 2. my-taro项目打包

```bash
$ yarn build:alipay:uniapp
```

#### 3. my-uniapp项目设置分包
在my-uniapp/dist/build/mp-alipay/app.json中配置分包
```
"subPackages": [
    {
      "root": "taro",
      "pages": ["pages/index/index", "pages/detail/index"]
    }
  ],
```
#### 4. 预览

小程序开发者工具导入项目，项目路径请指向 `my-uniapp/dist/build/mp-alipay`。
