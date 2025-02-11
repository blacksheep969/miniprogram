const cloud = require("wx-server-sdk");

// ✅ 确保云函数运行在正确的环境
cloud.init({ env: "blacksheep-6g40uxj910ea868f" });

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  if (!wxContext.OPENID) {
    console.error("【获取 openid 失败】:", wxContext);
    return { success: false, message: "获取 openid 失败，请重试", event };
  }

  console.log("【云函数 login 调用成功】获取 openid:", wxContext.OPENID);

  return {
    success: true,
    openid: wxContext.OPENID, // ✅ 确保 openid 存在
    event
  };
};