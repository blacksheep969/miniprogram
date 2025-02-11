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
              console.log("【获取到的拼车数据】:", carpool);

              // 🚗 **计算车头人数**
              const headCount = carpool.peopleCount - carpool.participants.length + 1;

              // 🧐 **判断当前用户是否是车头**
              const isHead = carpool.participants[0].openid === openid; // ✅ 车头一定在 participants[0]

              // 🚀 **修正剩余人数计算**
              const remainingPeople = isHead
                  ? Math.max(carpool.peopleCount - headCount, 0) // 🚗 车头退出，减去所有车头人数
                  : Math.max(carpool.peopleCount - 1, 0); // 👤 成员退出，人数只减少 1

              console.log("🚀【当前用户是否是车头】:", isHead);
              console.log("🚗【计算出的车头人数】:", headCount);
              console.log("🔢【退出后剩余拼车人数】:", remainingPeople);

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
        const headCount = carpool.peopleCount - carpool.participants.length + 1;
    
        // ❌ **从 `participants` 里移除当前用户**
        let updatedParticipants = carpool.participants.filter(p => p.openid !== openid);
    
        // 🚀 **计算退出后的人数**
        let updatedPeopleCount = carpool.participants[0].openid === openid
            ? Math.max(carpool.peopleCount - headCount, 0) // 🚗 车头退出，减少所有车头人数
            : Math.max(carpool.peopleCount - 1, 0); // 👤 成员退出，人数只减少 1
    
        console.log("【退出拼车】当前 carpool 信息:", carpool);
        console.log("【更新后的 participants】:", updatedParticipants);
        console.log("【更新后的 peopleCount】:", updatedPeopleCount);
    
        // 🗑 **如果 `participants` 为空，删除拼车信息**
        if (updatedParticipants.length === 0) {
            console.log("🚨【触发删除拼车】文档 ID:", carpool._id);
    
            db.collection(collectionName)
                .doc(carpool._id)
                .remove()
                .then(() => {
                    console.log("✅【拼车已成功删除】");
                    wx.showToast({ title: "拼车已取消" });
    
                    // **更新退出统计**：如果车头退出，更新退出次数
                    this.updateExitStats(openid, carpool._id, true); // 传入 `true` 表示车头退出
    
                    wx.switchTab({ url: "/pages/my/my" }); // 🚀 退出后跳转到"我的"
                })
                .catch(err => {
                    console.error("❌【删除拼车失败】:", err);
                    wx.showToast({ title: "退出失败，请重试", icon: "none" });
                });
            return;
        }
    
        // 👑 **选 `participants[0]` 作为新的车头**
        const newHead = updatedParticipants.length > 0 ? updatedParticipants[0].openid : null;
        console.log("🚀【新车头 openid】:", newHead);
    
        db.collection(collectionName)
            .doc(carpool._id)
            .update({
                data: {
                    participants: updatedParticipants,
                    peopleCount: updatedPeopleCount
                }
            })
            .then(() => {
                console.log("✅【拼车更新成功】");
                wx.showToast({ title: "退出成功" });
    
                // **更新退出统计**：如果是车头退出，更新退出次数
                this.updateExitStats(openid, carpool._id, false); // 传入 `false` 表示成员退出
    
                wx.switchTab({ url: "/pages/my/my" }); // 🚀 退出后跳转到"我的"
            })
            .catch(err => {
                console.error("❌【退出拼车失败】:", err);
                wx.showToast({ title: "退出失败，请重试", icon: "none" });
            });
    }
    ,
    
    // **更新退出统计**
updateExitStats(openid, carpoolId, isHeadExit) {
    wx.cloud.callFunction({
        name: 'updateExitStats',
        data: {
            openid,
            carpoolId,  // 传递 carpoolId 参数
            isPublisher: isHeadExit  // 判断是否为车头退出，传递 isPublisher 参数
        },
        success: res => {
            console.log("退出统计更新成功", res);
        },
        fail: err => {
            console.error("退出统计更新失败", err);
        }
    });
}
,
    
    cancelExit() {
        wx.navigateBack();
    }
});