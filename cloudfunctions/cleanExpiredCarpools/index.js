const cloud = require('wx-server-sdk');
// ✅ 确保云函数运行在正确的环境
cloud.init({ env: "blacksheep-6g40uxj910ea868f" });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 获取当前日期，格式为 yyyy-mm-dd
    const now = new Date();
    now.setDate(now.getDate() - 3);  // 设置为三天前的日期
    const threeDaysAgo = now.toISOString().split('T')[0]; // 格式化为 yyyy-mm-dd

    // 删除三天前的数据
    const collections = [
      'schoolToJZ_requests',
      'JZToSchool_requests',
      'schoolToTrain_requests',
      'trainToSchool_requests',
      'other_routes_requests'
    ];

    for (const collection of collections) {
      const result = await db.collection(collection)
        .where({
          date: db.command.lt(threeDaysAgo)  // 查找三天前的数据
        })
        .remove();  // 删除符合条件的数据

      console.log(`删除 ${collection} 中的过期数据：`, result.stats.removed);
    }

    return {
      success: true,
      message: '过期数据清理成功'
    };
  } catch (error) {
    console.error('删除过期数据时出错:', error);
    return {
      success: false,
      message: '清理失败',
      error: error.message
    };
  }
};