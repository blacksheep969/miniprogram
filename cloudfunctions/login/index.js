const cloud = require("wx-server-sdk");

// ✅ 初始化云开发环境
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  console.log("login 云函数被调用，获取 openid:", wxContext.OPENID);
  return {
    openid: wxContext.OPENID, // ✅ 确保返回 openid
    event
  };
};