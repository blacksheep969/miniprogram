Page({
    data: {
        carpool: null,
        openid: "",
        remainingPeople: 0,
        collectionName: ""
    },

    onLoad(options) {
        const openid = wx.getStorageSync("openid");
        this.setData({ openid, collectionName: options.collection });

        const db = wx.cloud.database();
        db.collection(options.collection)
          .doc(options.id)
          .get()
          .then(res => {
              const carpool = res.data;
              const remainingPeople = carpool.peopleCount - 1; // 🚀 计算退出后的剩余人数
              this.setData({ carpool, remainingPeople });
          })
          .catch(err => {
              console.error("【获取拼车详情失败】:", err);
              wx.showToast({ title: "加载失败，请重试", icon: "none" });
          });
    },

    confirmExit() {
        const { carpool, openid, collectionName } = this.data;
        const db = wx.cloud.database();

        // 🚗 **计算车头人数**
        const headCount = carpool.peopleCount - (carpool.participants.length - 1);

        // ❌ **从 `participants` 里移除当前用户**
        const updatedParticipants = carpool.participants.filter(p => p.openid !== openid);

        // 🚪 **减少 `peopleCount`**
        const updatedPeopleCount = Math.max(carpool.peopleCount - headCount, 0);

        // 🗑 **如果 `participants` 为空，删除拼车信息**
        if (updatedParticipants.length === 0) {
            db.collection(collectionName)
              .doc(carpool._id)
              .remove()
              .then(() => {
                  wx.showToast({ title: "拼车已取消" });
                  wx.navigateBack();
              })
              .catch(err => {
                  console.error("【删除拼车失败】:", err);
                  wx.showToast({ title: "退出失败，请重试", icon: "none" });
              });
            return;
        }

        // 👑 **选 `participants[0]` 作为新的车头**
        const newHead = updatedParticipants.length > 0 ? updatedParticipants[0].openid : null;

        // 🔄 **更新 `_openid` 为新的车头**
        db.collection(collectionName)
          .doc(carpool._id)
          .update({
              data: {
                  participants: updatedParticipants,
                  peopleCount: updatedPeopleCount,
                  _openid: newHead
              }
          })
          .then(() => {
              wx.showToast({ title: "退出成功" });
              wx.navigateBack();
          })
          .catch(err => {
              console.error("【退出拼车失败】:", err);
              wx.showToast({ title: "退出失败，请重试", icon: "none" });
          });
    },

    cancelExit() {
        wx.navigateBack();
    }
});