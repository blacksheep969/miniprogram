const cloud = require('wx-server-sdk');
// ✅ 确保云函数运行在正确的环境
cloud.init({ env: "blacksheep-6g40uxj910ea868f" });
// 获取当前时间并计算3天前的时间戳
const THREE_DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000;
const currentDate = new Date();
const threeDaysAgo = new Date(currentDate.getTime() - THREE_DAYS_IN_MS);
const threeDaysAgoDate = threeDaysAgo.toISOString().split('T')[0];  // 格式化成 yyyy-mm-dd

exports.main = async (event, context) => {
  const db = cloud.database();
  
  const collections = [
    "schoolToJZ_requests",
    "JZToSchool_requests",
    "schoolToTrain_requests",
    "trainToSchool_requests",
    "other_routes_requests"
  ];
  
  // 迁移数据的操作
  const migrateData = async (collectionName) => {
    try {
      // 查询所有三天前的数据
      const res = await db.collection(collectionName)
        .where({
          date: db.command.lte(threeDaysAgoDate)  // 只选择三天前的数据
        })
        .get();
      
      if (res.data.length > 0) {
        console.log(`【${collectionName}】迁移数据：`, res.data);
        
        // 将数据插入到历史数据集合中
        const historicalCollection = db.collection('historical_carpool_records');
        await historicalCollection.add({
          data: res.data.map(item => ({
            ...item,
            migratedAt: new Date().toISOString()  // 添加迁移时间戳
          }))
        });

        // 删除原集合中的数据
        await db.collection(collectionName)
          .where({
            date: db.command.lte(threeDaysAgoDate)
          })
          .remove();
        
        console.log(`【${collectionName}】的过期拼车数据已成功迁移到历史集合并删除原数据`);
      } else {
        console.log(`【${collectionName}】没有需要迁移的过期数据`);
      }
    } catch (err) {
      console.error(`【${collectionName}】迁移失败：`, err);
    }
  };

  // 遍历所有集合，进行数据迁移
  for (const collection of collections) {
    await migrateData(collection);
  }

  return {
    success: true,
    message: '过期拼车数据清理和迁移完成'
  };
};