import $http from "/common/httpRequest";
import $api from "/common/api";

App({
  globalData: {
    // socketUrl: "wss://facepayapi.zguan.cn/wss",//自己的服务器网址
    socketUrl: "wss://api.2020demo.jiafuw.com/wss", //测试服
    firstSend: false,
    limit: 0,
    timeoutObj: null,
    intervalObj: null,
    clientData: "pong" //客户端发送的数据
  },
  onLaunch(options) {
    let that = this;
    // 设置机器设备的SN进入缓存
    let { data } = my.getStorageSync({ key: 'equipment_SN' });
    if (!data) {
      let { value } = my.ix.getSysPropSync({ key: 'ro.serialno' });
      my.setStorageSync({ key: 'equipment_SN', data: value });
    }
    // 设置机器设备的SN进入缓存
    that.linkSocket();
  },

  //建立websocket连接
  linkSocket() {
    var that = this
    my.connectSocket({
      url: that.globalData.socketUrl,
      success() {
        let { value } = my.ix.getSysPropSync({ key: 'ro.serialno' });
        that.globalData.clientData = { sn: value, type: 1 };
        that.initEventHandle();
        that.globalData.firstSend = true;
      }
    })
  },

  //绑定事件
  initEventHandle() {
    var that = this
    // console.log(that.globalData.firstSend);
    if (that.globalData.firstSend === false) {
      my.onSocketOpen(() => {
        // console.log('链接一打开');
        that.intervalObj = setInterval(function () {
          that.timedSend();
        }, 5000)
      })
      my.onSocketMessage((res)=> {
        let {price,type,order_sn,old_sn} = JSON.parse(res.data);; //old_sn web端的唯一设备号,用于socket进行推送
        if (type == 1 || type == 2) { 
          switch(type){
             case 1:
              $http.POST($api.swiper.amountPay, { price:price }).then((res) => {
                  if (res.data.code === 200) {
                    this.upFacePay(order_sn,price,type);
                  } else {
                    my.showToast({
                      type: 'exception',
                      content: res.data.msg
                    });
                  }
                })
              break;
             case 2:
                   this.upFacePay(order_sn,price,type,old_sn);
              break; 
          }
        }
      })

      my.onSocketError((res) => {
        // console.log('WebSocket连接打开失败')
        this.reconnect();
      })

      my.onSocketClose((res) => {
        // console.log('WebSocket 已关闭！')
        this.reconnect();
      })
    }
  },

  timedSend: function () { //定时发送信息保持心跳
    let that = this;
    my.sendSocketMessage({
      data: that.globalData.clientData, // 需要发送的内容
      success: function () {
        that.globalData.clientData = "pong";
      }
    });
  },

  reconnect: function () { //网络错误重连
    var that = this;
    clearInterval(that.intervalObj);
    clearTimeout(that.timer);
    if (that.globalData.limit < 10) {
      that.timer = setTimeout(() => {
        //  console.log("socket重连",that.globalData.limit);
        that.globalData.limit++;
        that.linkSocket();
      }, 10000);
    }
  },
  upFacePay(ORDER_SN,PRICE,TYPE,OLD_SN) { //调用刷脸支付
    my.ix.startApp({
      appName: 'cashier',
      bizNo: ORDER_SN,
      totalAmount: PRICE,
      success: (r) => {
        $http.POST($api.orderPay.alipy, {'bar_code': r.barCode,'order_sn': r.bizNo }).then((res) => { //提交刷脸支付二维码及订单单号
          if (res.data.code === 200) {
            my.showToast({ content: '支付成功' });
          } else {
            my.showToast({
              type: 'exception',
              content: res.data.msg
            });
          }
        });
      },
      fail: (cancel) => {
        let { value } = my.ix.getSysPropSync({ key: 'ro.serialno' });
        let userCancel;
        if (TYPE == 1) { //商家端 用户取消
          userCancel = { sn: value, type: 3 };
        } else if (TYPE == 2) { //web端 用户取消
          userCancel = { sn: value, type: 5, old_sn: OLD_SN };
        }
        my.sendSocketMessage({ //通知服务器端用户取消操作
          data: userCancel,
          success:()=>{
            my.showToast({ content: '取消支付', type: 'exception' });
          }
        });
      }
    });
  }
});