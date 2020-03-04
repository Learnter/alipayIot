
const API = {
    swiper:{
      storeInfo:'index/storeInfo',
      homeSwiper:'index/adList',
      amountPay:'order/craeteNoGoodsOrder'
    },
    orderPay:{
      cateLeft:'goods/cateList', //左边分类
      cateRight:'goods/getGoodsByCateId',//右边商品列表
      specification:'goods/goodsSpecPriceByGoodsId',//商品规格
      price:'goods/priceBySpec',//商品价格
      addCart:'cart/storeAddGoodsToCart',//添加购物车
      cartList:'cart/storeCartList',//购物车列表
      changeNum:'cart/storeChangeGoodsNumFromCart',//购物车列表更改数量
      deleteCart:'cart/storeDelGoodsFromCart',//删除购物车列表
      clearCart:'cart/storeClearCart',//清空购物车
      alipay:'order/alipayToPay',//刷脸后支付接口
      createOrder:'order/storeCommitOrder',//创建结算订单
      alipy:'order/alipayToPay' //支付宝刷脸支付
    }
}
module.exports = API