import $http from "/common/httpRequest";
import $api from "/common/api";
Page({
  data: {
    list: [],//轮播图列表
    storeName: '',//店铺名称
    startType: ''//店铺收银模式
  },
  onShow(){
    this.fetchSwipers();
    this.fetchStoreInfo();
  },
  fetchStoreInfo() { //获取商家信息
    $http.POST($api.swiper.storeInfo).then((res) => {
      if (res.data.code === 200) {
        let { store_name, pattern } = res.data.data;
        my.setNavigationBar({title: store_name }); //动态设置导航条店铺名
        my.setStorageSync({ key: 'storeName', data: store_name }); //将店铺名设置入缓存
        this.setData({
          storeName: store_name,
          startType: pattern
        })
      }
    })
  },
  fetchSwipers() {  //获取首页轮播
    $http.POST($api.swiper.homeSwiper, { type: 2 }).then((res) => {
      if (res.data.code === 200) {
        this.setData({
          list: res.data.data
        })
      }
    })
  },
  settleSum() { //导航到开始结算
    my.navigateTo({ url: '/pages/settleAccount/settleAccount' })
  },
  chooseShop() { //导航到购物列表
    my.navigateTo({ url: '/pages/index/index' })
  },
  // navSetup() { //导航到系统设置页面
  //   my.ix.startApp({
  //     appName: 'settings'
  //   });
  // }
});
