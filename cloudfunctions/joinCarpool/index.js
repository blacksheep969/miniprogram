const cloud = require("wx-server-sdk");

cloud.init({ env: "blacksheep-6g40uxj910ea868f" });
const db = cloud.database();

exports.main = async (event, context) => {
  const { carpoolId, userOpenid, userWechatId, collectionName } = event;
  
  console.log("【云函数被调用】参数:", event);

  // ✅ 获取最新拼车数据（确保数据最新）
  const carpoolDoc = await db.collection(collectionName).doc(carpoolId).get();
  if (!carpoolDoc.data) {
    return { success: false, message: "拼车信息不存在" };
  }

  const carpool = carpoolDoc.data;
  console.log("【当前拼车数据】:", carpool);

  // 🚨 **如果车队已满，拒绝加入**
  if (carpool.participants.length >= 4) {
    return { success: false, message: "车队已满" };
  }

  // ✅ **确保不重复加入**
  const alreadyJoined = carpool.participants.some(p => p.openid === userOpenid);
  if (alreadyJoined) {
    return { success: false, message: "您已在该拼车队伍中" };
  }

  // ✅ **正确计算新 `peopleCount`**
  const updatedPeopleCount = carpool.peopleCount + 1; // **peopleCount 需要+1**

  // ✅ **更新 `participants` 数组**
  const updatedParticipants = [...carpool.participants, { openid: userOpenid, wechatId: userWechatId }];

  // **确保车头（发布者）在第一位**
  updatedParticipants.sort((a, b) => (a.openid === carpool._openid ? -1 : 1));

  console.log("【更新后的 participants】:", updatedParticipants);
  console.log("【更新后的 peopleCount】:", updatedPeopleCount);

  // 🚀 **更新数据库**
  try {
    await db.collection(collectionName).doc(carpoolId).update({
      data: {
        participants: updatedParticipants,
        peopleCount: updatedPeopleCount
      }
    });

    // **更新用户加入统计**：调用云函数更新用户的加入次数
    await updateJoinStats(userOpenid);

    return { success: true, message: "加入成功" };
  } catch (err) {
    console.error("【数据库更新失败】:", err);
    return { success: false, message: "系统繁忙，请稍后重试", error: err };
  }
};

// **更新用户加入统计**：该函数会增加用户的“加入次数”
async function updateJoinStats(openid) {
  try {
    await db.collection('user_carpool_stats').doc(openid).update({
      data: {
        joinCount: db.command.inc(1),  // 增加 1 次加入
      }
    });
    console.log("用户加入统计更新成功！");
  } catch (err) {
    console.error("更新用户统计数据失败:", err);
  }
}
