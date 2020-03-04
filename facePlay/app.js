import $http from "/common/httpRequest";
import $api from "/common/api";

App({
   globalData: {
    socketUrl: "wss://facepayapi.zguan.cn/wss",//自己的服务器网址
    firstSend:false,
    limit: 0,
    timeoutObj: null,
    intervalObj: null,
    clientData:"pong"
  }, 
  onLaunch(options) {
    let that = this;
    //设置机器设备的SN进入缓存
    // let { data } = my.getStorageSync({ key: 'equipment_SN' });
    // if (!data) {
    //   let { value } = my.ix.getSysPropSync({ key: 'ro.serialno' });
    //   my.setStorageSync({ key: 'equipment_SN', data: value });
    // }
    //设置机器设备的SN进入缓存

    that.linkSocket();
  },

  //建立websocket连接
  linkSocket() {
    var that = this
    my.connectSocket({
      url: that.globalData.socketUrl,
      success() {
        // let { value } = my.ix.getSysPropSync({ key: 'ro.serialno' });
        // that.clientData = {sn:value,type:1};
        that.globalData.clientData = "111";
        that.initEventHandle();
    	  that.globalData.firstSend = true;
      }
    })
  },

  //绑定事件
  initEventHandle() {
    var that = this
    that.globalData.limit = 0;

   if(that.globalData.firstSend === false) {
    my.onSocketOpen(() => {
    console.log('链接一打开');
      that.intervalObj = setInterval(function(){
        that.timedSend();
      },10000)  
    })

   my.onSocketMessage(function(res) {
     var that = this;
     // that.globalData.intervalObj = setTimeout(function(){
     //    that.timedSend();
     //  },30000)  
        let serverData = JSON.parse(res.data)
        if (serverData && serverData.type == 1) {
          $http.POST($api.swiper.amountPay, { price: serverData.price }).then((res) => {
            if (res.data.code === 200) {
              my.ix.startApp({
                appName: 'cashier',
                bizNo: res.data.data.order_sn,
                totalAmount: res.data.data.order_amount.toString(),
                success: (r) => {
                  $http.POST($api.orderPay.alipy, { 'bar_code': r.barCode, 'order_sn': r.bizNo }).then((res) => { //提交刷脸支付二维码及订单单号
                    if (res.data.code === 200) {
                      my.showToast({ content: '支付成功'});
                    } else {
                      my.showToast({
                        type: 'exception',
                        content: res.data.msg
                      });
                    }
                  });
                },
                fail: (cancel) => {
                  if(cancel.error == 1500){
                    my.showToast({ content: '用户取消支付', type: 'exception' });
                    let { value } = my.ix.getSysPropSync({ key: 'ro.serialno' }); 
                    let userCancel = { sn: value, type: 3};
                    my.sendSocketMessage({ //通知服务器端用户取消操作
                      data: userCancel
                    });
                  }
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
      })
    my.onSocketError((res) => {
      console.log('WebSocket连接打开失败')
      this.reconnect();
    })

   my.onSocketClose((res) => {
      console.log('WebSocket 已关闭！')
        this.reconnect();
    })
   }
  },

  timedSend: function(){ //定时发送信息保持心跳
    let that = this;
    
    my.sendSocketMessage({
      data: that.globalData.clientData, // 需要发送的内容
      success:function(){
       
        console.log("发送消息成功：",that.globalData.clientData);
        that.globalData.clientData = "pong";
      }
    });
  },

  reconnect:function(){ //网络错误重连
      console.log(this.timer);
    // return this.linkSocket();
    var that = this; 
    clearInterval(that.intervalObj);
    clearTimeout(that.timer);
      that.timer = setTimeout(() => {
      console.log("socket重连",that.globalData.limit);
      that.globalData.limit++;
        that.linkSocket();
      }, 30000);
  }
});