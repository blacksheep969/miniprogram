const cloud = require('wx-server-sdk');
// ✅ 确保云函数运行在正确的环境
cloud.init({ env: "blacksheep-6g40uxj910ea868f" });
const db = cloud.database();

exports.main = async (event, context) => {
  const { openid } = event;
  
  const res = await db.collection('user_carpool_stats').where({ openid }).get();
  
  if (res.data.length === 0) {
    // 如果没有数据，则初始化
    await db.collection('user_carpool_stats').add({
      data: {
        openid,
        publishCount: 0,
        publishExitCount: 0,
        joinCount: 0,
        joinExitCount: 0,
        totalParticipations: 0,
        carpoolRecords: [],
        currentCarpoolCount: 0
      }
    });
    return { success: true, message: '初始化用户统计数据成功' };
  } else {
    return { success: true, message: '用户统计数据已存在' };
  }
};