import $http from "/common/httpRequest";
import $api from "/common/api";
Page({
  reConfig: {
    cate_id: '',
    page: 0,
    page_num: 10
  },
  data: {
    isEmpty: false,//是否列表为空
    isLoadEnd: false,//是否已经加载完
    swipeIndex: null,
    right: [{ type: 'delete', text: '删除' }],
    spdpopup: false,//规格弹窗
    gwcpopup: false,//购物车弹窗
    categoryList: [], //左边分类
    subCategoryList: [],//右边分类
    spec_data: [],//规格参数列表
    garnish: [],//规格附加列表
    cardsList: [],//购物车列表
    activeGood: '',//激活的商品id
    activeGoodsName: '',//激活的商品名字
    active_good_num: 1,//激活商品的数量
    active_init_price: 0,//激活规格的初始化价格
    active_total_price: 0,//激活规格的总价格
    active_spec_data: [],//激活的规格选项列表
    appendList: [],//激活的附加项id
    height: 0,
    categoryActive: 0,
    scrollTop: 0,
    cardSumNum: 0,//总购物数
    cardSumMoney: 0 //总购物金额
  },
  scroll(e) { //监听滚动高度
    this.setData({
      'scrollHeight': e.detail.scrollHeight
    });
  },
  categoryClickMain(event) { //切换左边分类列表
    let { item, index } = event.target.dataset;
    this.reConfig.cate_id = item.cate_id;
    this.reConfig.page = 0;
    this.setData({
      isLoadEnd: false,
      isEmpty: false,
      categoryActive: index,
      scrollTop: -this.data.scrollHeight * index
    })
    this.getCategoryRight();
  },
  getCategory() { //获取左边分类列表
    $http.POST($api.orderPay.cateLeft).then((res) => {
      if (res.data.code === 200) {
        this.reConfig['cate_id'] = res.data.data[0].cate_id;
        this.setData({
          categoryList: res.data.data
        })
        this.getCategoryRight();
      }
    })
  },
  getCategoryRight() { //获取右边商品列表
    my.showLoading({
      content: '加载中...'
    })
    $http.POST($api.orderPay.cateRight, this.reConfig).then((res) => {
      setTimeout(() => {
        my.hideLoading();
      }, 500)
      if (res.data.code === 200) {
        if (res.data.data.length < this.reConfig.page_num) { //判断是否加载完数据
          this.setData({
            isLoadEnd: true
          })
        }
        this.setData({
          subCategoryList: res.data.data
        })
      } else {
        my.showToast({
          type: 'exception',
          content: res.data.msg
        });
      }
    })
  },
  chooseType(e) { //选择规格
    let { goodId, goodName, goodPrice } = e.target.dataset;
    $http.POST($api.orderPay.specification, { goods_id: goodId }).then((res) => {
      if (res.data.code === 200) {
        let activeSpecItem = [];
        if (Object.keys(res.data.data).length !== 0) {
          let { spec_data, garnish } = res.data.data; //对象解构
          spec_data.forEach((item) => { //默认选中第一个
            item.items[0].selected = true;
            activeSpecItem.push(item.items[0].id);
          })
          this.setData({ //赋值
            spdpopup: true,
            activeGoodsName: goodName,
            activeGood: goodId,
            garnish: garnish,
            'spec_data': spec_data,
            'active_spec_data': activeSpecItem
          });
        } else {
          this.setData({ //赋值
            spdpopup: true,
            activeGoodsName: goodName,
            activeGood: goodId,
            garnish: [],
            'active_init_price': goodPrice * 1,
            'active_total_price': goodPrice * 1,
            'spec_data': [],
            'active_spec_data': []
          });
        }
        if (activeSpecItem.length > 0) {
          this.fetchSpecMoney(goodId, activeSpecItem.join("_"));
        }
      } else {
        my.showToast({
          type: 'exception',
          content: res.data.msg
        });
      }
    })
  },
  selspec(e) { //选择规格列表
    let { parentIndex, index, childItem } = e.target.dataset;//对象解构
    let { spec_data, active_spec_data, appendList } = this.data;

    active_spec_data[parentIndex] = childItem.id; //根据父索引赋值新的规格id

    spec_data[parentIndex].items.forEach((item) => { //激活新的选项、取消旧的选项
      item.id === childItem.id ? item.selected = true : item.selected = false;
    });
    this.fetchSpecMoney(this.data.activeGood, active_spec_data.join("_")); //动态获取商品规格价格

    this.setData({
      'spec_data': spec_data,
      appendList: []
    })
  },
  selAppendList(e) { //选择附加列表
    let { appendItem } = e.target.dataset;
    let { appendList, active_total_price, active_good_num } = this.data;

    if (appendList.indexOf(appendItem.id) == -1) { //添加、减少附加参数逻辑
      appendList.push(appendItem.id);
      active_total_price += appendItem.shop_price * active_good_num;
    } else {
      appendList.splice(appendList.indexOf(appendItem.id), 1);
      active_total_price -= appendItem.shop_price * active_good_num;
    }
    this.setData({ //重新赋值渲染数据
      'active_total_price': active_total_price,
      appendList: appendList
    })
  },
  callBackFn(value) { //选择数量
    let { active_init_price, appendList, garnish } = this.data;
    let totalPrice = active_init_price * value;
    garnish.forEach((item) => {
      appendList.indexOf(item.id) !== -1 ? totalPrice += item.shop_price * value : '';
    });
    this.setData({
      'active_good_num': value,
      'active_total_price': totalPrice
    })
  },
  fetchSpecMoney(goodsId, specIds) { //获取规格金额
    let { active_good_num } = this.data;
    $http.POST($api.orderPay.price, { 'goods_id': goodsId, 'spec_ids': specIds }).then((res) => {
      if (res.data.code === 200) {
        if (res.data.data) {
          let { shop_price } = res.data.data;
          this.setData({
            'active_init_price': shop_price,
            'active_total_price': shop_price * active_good_num
          })
        }
      } else {
        my.showToast({
          type: 'exception',
          content: res.data.msg,
          duration: 3000
        });
      }
    })
  },
  addGoodsget() { //添加购物车
    let { active_good_num, active_spec_data, appendList, activeGood } = this.data;
    let config = { 'goods_id': activeGood, 'goods_num': active_good_num, 'item_key': active_spec_data.join("_"), garnish: appendList.join() };
    // my.showLoading({ content: '提交中...' });
    $http.POST($api.orderPay.addCart, config).then((res) => {
      // my.hideLoading();
      if (res.data.code === 200) {
        my.showToast({
          content: '添加成功',
          type: 'success'
        });
        this.setData({
          'active_good_num': 1,
          spdpopup: false,
          appendList: []
        })
        this.fetchCardsList();
      } else {
        my.showToast({
          type: 'exception',
          content: res.data.msg,
          duration: 3000
        });
      }
    })
  },
  fetchCardsList() { //获取购物车列表
    $http.POST($api.orderPay.cartList).then((res) => {
      if (res.data.code === 200) {
        if (res.data.data) {
          let cardsList = res.data.data.list;
          // console.log(res,this.data.cardsList);
          let sumMoney = 0, sumNum = 0;
          if (cardsList) {
            sumNum = cardsList.length;
            cardsList.forEach((item) => {
              sumMoney += (item.amount * item.goods_num);
            });
          } else {
            this.setData({
              gwcpopup: false
            })
          }
          this.setData({
            cardsList: cardsList || [],
            cardSumNum: sumNum || 0,
            cardSumMoney: sumMoney
          })
        }
      } else {
        my.showToast({
          type: 'exception',
          content: res.data.msg,
          duration: 3000
        });
      }
    })
  },
  onSwipeStart(e) { //隐藏其他删除滑动框
    this.setData({
      swipeIndex: e.index,
    });
  },
  onRightItemClick(e) { //删除购物车列表
    let { extra } = e;
    $http.POST($api.orderPay.deleteCart, { 'goods_id': extra.goods_id }).then((res) => {
      if (res.data.code === 200) {
        my.showToast({ content: '商品删除成功' });
        this.setData({ //隐藏删除滑动框
          swipeIndex: null
        })
        this.fetchCardsList();
      } else {
        my.showToast({
          type: 'exception',
          content: res.data.msg,
          duration: 3000
        });
      }
    })
  },
  changeCardNumber(value, index, obj) { //增减购物车数量
    let dynamicType = value > obj.goods_num ? 1 : 2; //判断是增加还是减少操作
    $http.POST($api.orderPay.changeNum, { id: obj.id, type: dynamicType }).then((res) => {
      if (res.data.code === 200) {
        this.fetchCardsList();
      } else {
        my.showToast({
          type: 'exception',
          content: res.data.msg,
          duration: 3000
        });
      }
    })
  },
  clickClearCards() { //点击清空购物车
    let { cardsList } = this.data;
    if (cardsList.length === 0)
      return my.showToast({
        content: '亲!空空如也'
      });
    my.confirm({
      title: '温馨提示',
      content: '您确认要清空列表吗?',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      success: (result) => {
        if (result.confirm) {
          this.clearCards();
        }
      },
    });
  },
  toSum() { //结算 ----重点 调用支付宝刷脸付逻辑
    if (!this.data.cardSumMoney) return my.showToast({ content: '购物车为空' });
    $http.POST($api.orderPay.createOrder, { type: 1 }).then((res) => { //获取后台商品订单号
      if (res.data.code === 200) {
        my.ix.startApp({
          appName: 'cashier',
          bizNo: res.data.data.order_sn,
          totalAmount: res.data.data.order_amount.toString(),
          success: (r) => {
            $http.POST($api.orderPay.alipy, { 'bar_code': r.barCode, 'order_sn': r.bizNo }).then((res) => { //提交刷脸支付二维码及订单单号
              if (res.data.code === 200) {
                this.setData({ //清空数据
                  gwcpopup: false,
                  cardSumNum: 0,
                  cardSumMoney: 0,
                  cardsList: []
                })
              } else {
                my.showToast({
                  type: 'exception',
                  content: res.data.msg
                });
              }
            });
          },
          fail: (cancel) => { //支付失败或用户点击取消,清空购物车数据
            // my.confirm({
            //   title: cancel.errorMessage,
            //   content: '您需要清空购物车吗?',
            //   confirmButtonText: '确定',
            //   cancelButtonText: '取消',
            //   success: (result) => {
            //     if (result.confirm) {
                  this.clearCards();
            //     }
            //   },
            // });
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
  loadMore() { //加载更多
    if (this.data.isLoadEnd) return;
    my.showLoading({
      content: '加载中...'
    })
    this.reConfig.page++;
    $http.POST($api.orderPay.cateRight, this.reConfig).then((res) => {
      setTimeout(() => {
        my.hideLoading();
      }, 500)
      if (res.data.code === 200) {
        if (res.data.data.length < this.reConfig.page_num) { //判断是否加载完数据
          this.setData({
            isLoadEnd: true
          })
        }
        this.setData({
          'subCategoryList': this.data.subCategoryList.concat(res.data.data)
        })
      } else {
        my.showToast({
          type: 'exception',
          content: res.data.msg
        });
      }
    })
  },

  watchCards() { //打开、关闭购物车弹窗
    let { cardsList } = this.data;
    if (cardsList.length === 0)
      return my.showToast({
        content: '亲!请添加商品'
      });
    this.setData({
      gwcpopup: !this.data.gwcpopup
    })
  },
  closeSpecMask() { //关闭商品规格弹窗
    this.setData({
      spdpopup: false,
      'active_good_num': 1,
      'active_spec_data': []
    })
  },
  clearCards() { //清空购物车数据
    $http.POST($api.orderPay.clearCart).then((res) => {
      if (res.data.code === 200) {
        this.setData({ //清空数据
          gwcpopup: false,
          cardSumNum: 0,
          cardSumMoney: 0,
          cardsList: []
        })
      } else {
        my.showToast({
          type: 'exception',
          content: res.data.msg
        });
      }
    })
  },
  onLoad(query) {
    let {data} = my.getStorageSync({key: 'storeName'});
    my.setNavigationBar({title:data});
    // 页面加载
    this.getCategory();
    this.data.height = my.getSystemInfoSync().windowHeight;
  },
  onReady() {
    // 页面加载完成
  },
  onShow() {
    // 页面显示
  },
  onHide() {
    // 页面隐藏
  },
  onUnload() {
    // 页面被关闭
  },
  onTitleClick() {
    // 标题被点击
  },
  onPullDownRefresh() {
    // 页面被下拉
  },
  onReachBottom() {
    // 页面被拉到底部
  },
  onShareAppMessage() {
    // 返回自定义分享信息
    return {
      title: 'My App',
      desc: 'My App description',
      path: 'pages/index/index',
    };
  },
});
