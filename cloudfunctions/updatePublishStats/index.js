// 云函数: updatePublishStats
const cloud = require('wx-server-sdk');
cloud.init();

const db = cloud.database();

exports.main = async (event, context) => {
  const { openid, carpoolInfo } = event;
  
  const res = await db.collection('user_carpool_stats').where({ openid }).get();
  
  if (res.data.length > 0) {
    const userStats = res.data[0];
    
    await db.collection('user_carpool_stats').doc(userStats._id).update({
      data: {
        publishCount: userStats.publishCount + 1,       // 发布次数增加
        totalParticipations: userStats.totalParticipations + 1, // 总参与次数增加
        carpoolRecords: db.command.push(carpoolInfo),    // 拼车信息存入记录中
        currentCarpoolCount: userStats.currentCarpoolCount + 1 // 当前拼车数增加
      }
    });
    return { success: true, message: '发布拼车统计更新成功' };
  } else {
    return { success: false, message: '未找到用户统计数据' };
  }
};






