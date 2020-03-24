
  // let BASEURL = 'https://facepayapi.zguan.cn/v1/customer/';//正式服
  let BASEURL = 'https://api.2020demo.jiafuw.com/v1/customer/'; //测试服
  const POST = function(Url,Data,Token) {
    //获取唯一设备号,并请求后端
    let {data} = my.getStorageSync({ key:'equipment_SN'});
    let newData;
    Data ? newData =  Object.assign(Data,{sn:data}) : newData =  Object.assign({},{sn:data});
    //获取唯一设备号,并请求后端
    // console.log(newData);
    return new Promise((resolve,reject)=>{
      my.request({
        url: BASEURL+Url,
        method:'POST',
        data:newData,
        success: function(result){
          resolve(result);
        },
        fail: function(result){
          my.showToast({
             content:'服务器数据请求失败'
          });
        }
      });
    })
  }

module.exports = {
  POST:POST
}