/*
 * @Author: zhouyan
 * @Date: 2022-10-14 16:48:07
 * @LastEditTime: 2022-10-25 10:57:08
 * @LastEditors: zhouyan
 * @Description: your Description
 */
import React, { Component } from "react";
import { View, Text } from "@tarojs/components";
import Article from "../../components/article";
import "./index.scss";

export default class Index extends Component {
  render() {
    return (
      <View>
        <Article name="详情页" />
        <Text className="detail-text">这是详情页</Text>
      </View>
    );
  }
}
