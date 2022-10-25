/*
 * @Author: zhouyan
 * @Date: 2022-09-29 19:37:16
 * @LastEditTime: 2022-10-25 10:57:31
 * @LastEditors: zhouyan
 * @Description: your Description
 */
import React, { Component } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Button } from "@tarojs/components";
import Article from "../../components/article";
import "./index.scss";

export default class Index extends Component {
  goToDetailPage() {
    Taro.navigateTo({
      url: "/pages/detail/index",
    });
  }
  render() {
    return (
      <View className="red index-ft">
        <Text>Hello world!</Text>
        <Article name="启动页" />
        <Button onClick={this.goToDetailPage} className="but">
          跳转至详情页
        </Button>
      </View>
    );
  }
}
