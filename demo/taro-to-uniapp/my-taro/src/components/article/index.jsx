/*
 * @Author: zhouyan
 * @Date: 2022-10-25 10:39:07
 * @LastEditTime: 2022-10-25 10:56:44
 * @LastEditors: zhouyan
 * @Description: your Description
 */
import React from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export default function(props) {
  return (
    <View className="title-cont">
      <View>
        Header: <Text className="title-text">这是{props.name}Header</Text>
      </View>
      <View>
        Footer: <Text className="title-text">这是{props.name}Footer</Text>
      </View>
    </View>
  );
}
