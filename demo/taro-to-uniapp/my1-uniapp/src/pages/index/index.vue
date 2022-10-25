<template>
  <view class="content">
    <image class="logo" src="/static/logo.png"></image>
    <view>
      <text class="title">{{ title }}</text>
      <button type="primary" @click="goToIndex" class="but">
        跳转到taro分包项目
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      title: "taro与uniapp混合开发",
    };
  },
  onLoad() {},
  methods: {
    goToIndex() {
      uni.navigateTo({
        url: "/taro/pages/index/index",
      });
    },
  },
};
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin: 200rpx auto 50rpx auto;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  color: #8f8f94;
}
.but {
  margin-top: 48rpx;
}
</style>
