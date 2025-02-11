// 云函数: updateExitStats
const cloud = require('wx-server-sdk');
// ✅ 确保云函数运行在正确的环境
cloud.init({ env: "blacksheep-6g40uxj910ea868f" });
const db = cloud.database();

exports.main = async (event, context) => {
  const { openid, isPublisher } = event; // 判断用户是否为车头退出
  
  // 获取用户统计数据
  const res = await db.collection('user_carpool_stats').where({ openid }).get();

  if (res.data.length > 0) {
    const userStats = res.data[0];

    // 构建更新的数据
    let updateData = {
      currentCarpoolCount: userStats.currentCarpoolCount - 1 // 退出拼车，当前拼车数量减少
    };

    if (isPublisher) {
      // 车头退出，增加 publishExitCount
      updateData.publishExitCount = userStats.publishExitCount + 1;
    } else {
      // 成员退出，增加 joinExitCount
      updateData.joinExitCount = userStats.joinExitCount + 1;
    }

    // 执行更新操作
    try {
      await db.collection('user_carpool_stats').doc(userStats._id).update({
        data: updateData
      });
      return { success: true, message: '退出拼车统计更新成功' };
    } catch (err) {
      console.error("更新失败:", err);
      return { success: false, message: "系统繁忙，请稍后重试" };
    }
  } else {
    return { success: false, message: '未找到用户统计数据' };
  }
};
