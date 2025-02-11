// 云函数：submitFeedback
const cloud = require('wx-server-sdk');
// ✅ 确保云函数运行在正确的环境
cloud.init({ env: "blacksheep-6g40uxj910ea868f" });
const db = cloud.database();

exports.main = async (event, context) => {
  const { feedback } = event; // 从事件中获取反馈内容

  // 调试：打印接收到的数据
  console.log("接收到的反馈数据：", feedback);

  try {
    // 将反馈存储到数据库
    const res = await db.collection('user_feedback').add({
      data: {
        feedback: feedback,
        createTime: new Date(),
      }
    });

    console.log("反馈提交成功，数据库返回：", res);
    return { success: true, message: "反馈提交成功" };
  } catch (err) {
    console.error("提交反馈失败", err);
    return { success: false, message: "反馈提交失败" };
  }
};
