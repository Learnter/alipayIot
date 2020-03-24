import $http from "/common/httpRequest";
import $api from "/common/api";
Page({
  data: {
    list: [], //轮播数据
    amount: '' //价格
  },
  onLoad() {
    let { data } = my.getStorageSync({ key: 'storeName' });
    my.setNavigationBar({ title: data });
    this.fetchSwipers();
  },
  onShow() {
    my.ix.onKeyEventChange((r) => { //监听键盘输入事件
      if (r.keyCode == 131) //键盘点击收款
        this.setData({ //赋值
          amount: r.amount
        })
      else if (r.keyCode == 133) { //键盘点击取消
        this.setData({
          amount: ''
        })
      } else if (r.keyCode == 132) { //键盘点击刷脸
        this.facePay();
      } else if (r.keyCode == 134) { //键盘点击设置
        my.ix.startApp({
          appName: 'settings'
        });
      }
    });
  },
  onHide() {
    my.ix.offKeyEventChange(); //关闭键盘监听事件
  },
  fetchSwipers() {  //获取首页轮播
    $http.POST($api.swiper.homeSwiper, { type: 1 }).then((res) => {
      if (res.data.code === 200) {
        this.setData({
          list: res.data.data
        })
      }
    })
  },
  inputOnBlur(e) { //输入框失去焦点
    let { value } = e.detail;
    this.setData({
      amount: value
    })
  },
  facePay() { //扫脸支付
    let { amount } = this.data;
    if (!amount) return my.showToast({ type: 'exception', content: '请先输入付款金额' });
    $http.POST($api.swiper.amountPay, { price: amount }).then((res) => {
      if (res.data.code === 200) {
        my.ix.startApp({
          appName: 'cashier',
          bizNo: res.data.data.order_sn,
          totalAmount: res.data.data.order_amount.toString(),
          success: (r) => {
            $http.POST($api.orderPay.alipy, { 'bar_code': r.barCode, 'order_sn': r.bizNo ,type:"1"}).then((res) => { //提交刷脸支付二维码及订单单号
              if (res.data.code === 200) {
                my.showToast({type: 'success',content: '支付成功!'});
                this.setData({ //清空数据
                  amount: ''
                })
              } else {
                my.showToast({
                  type: 'exception',
                  content: res.data.msg
                });
              }
            });
          },
          fail: (cancel) => {
            my.showToast({content:'取消支付', type:'exception'});
            this.setData({
                amount: ''
            })
          }
        });
      } else {
        my.showToast({
          type: 'exception',
          content: res.data.msg
        });
      }
    })
  },
  codePay() { //扫码支付
    let { amount } = this.data;
    if (!amount) return my.showToast({ type: 'exception', content: '请先输入付款金额' });
    $http.POST($api.swiper.amountPay, { price: amount }).then((res) => {
      if (res.data.code === 200) {
        my.showToast({type: 'none',content: '请出示付款码'});
        my.ix.startApp({
          appName: 'cashier',
          bizNo: res.data.data.order_sn,
          totalAmount: res.data.data.order_amount.toString(),
          showScanPayResult: true,
          success: (r) => {
            $http.POST($api.orderPay.alipy, { 'bar_code': r.barCode, 'order_sn': r.bizNo ,type:"1" }).then((res) => { //提交刷脸支付二维码及订单单号
              if (res.data.code === 200) {
                my.showToast({type: 'success',content: '支付成功!'});
                this.setData({ //清空数据
                  amount: ''
                })
              } else {
                my.showToast({
                  type: 'exception',
                  content: res.data.msg
                });
              }
            });
          },
          fail: (cancel) => {
            my.showToast({content:'取消支付', type:'exception'});
            this.setData({
                amount: ''
            })
          }
        });
      } else {
        my.showToast({
          type: 'exception',
          content: res.data.msg
        });
      }
    })
  }
});