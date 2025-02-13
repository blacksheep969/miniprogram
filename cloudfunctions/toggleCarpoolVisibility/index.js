const cloud = require("wx-server-sdk");
cloud.init({ env: "blacksheep-6g40uxj910ea868f" });
const db = cloud.database();

exports.main = async (event, context) => {
    const { carpoolId, collectionName, newHiddenStatus } = event;

    try {
        // 更新拼车信息的 hidden 状态
        await db.collection(collectionName).doc(carpoolId).update({
            data: { hidden: newHiddenStatus }
        });

        return { success: true, message: `拼车状态已更新为 ${newHiddenStatus ? "隐藏" : "可见"}` };
    } catch (err) {
        console.error("【隐藏拼车更新失败】:", err);
        return { success: false, message: "操作失败，请稍后重试", error: err };
    }
};