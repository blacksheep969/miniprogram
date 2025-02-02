Page({
    data: {
        carpool: null,
        userWechatId: "" // ✅ 确保变量存在
    },

    onLoad(options) {
        const db = wx.cloud.database();
        const id = options.id;
    
        console.log("【接收到的拼车 ID】:", id);
    
        if (!id) {
            wx.showToast({ title: "数据错误，请返回", icon: "none" });
            wx.navigateBack();
            return;
        }
    
        const collections = [
            "schoolToJZ_requests",
            "JZToSchool_requests",
            "schoolToTrain_requests",
            "trainToSchool_requests",
            "other_routes_requests"
        ];
    
        let found = false;
    
        collections.forEach(collection => {
            console.log(`【正在查询集合】: ${collection}`);
    
            db.collection(collection)
                .doc(id)
                .get()
                .then(res => {
                    console.log(`【${collection} 查询成功】`, res.data);
                    if (res.data) {
                        // ✅ **如果数据库里没有 `collectionName`，手动添加**
                        res.data.collectionName = collection;
                        this.setData({ carpool: res.data });
                        console.log("【最终拼车数据】:", this.data.carpool);
                        found = true;
                    }
                })
                .catch(err => {
                    console.warn(`【查询 ${collection} 失败】`, err);
                });
        });
    
        setTimeout(() => {
            if (!found) {
                wx.showToast({ title: "拼车信息不存在", icon: "none" });
                wx.navigateBack();
            }
        }, 2000);
    },

    // **✅ 获取集合名称**
    getCollectionName(id) {
        // 这里假设不同路线的 ID 规则不同，如果有特定逻辑请替换
        const routeCollections = {
            "schoolToJZ_requests": "学校 → 九州",
            "JZToSchool_requests": "九州 → 学校",
            "schoolToTrain_requests": "学校 → 高铁站",
            "trainToSchool_requests": "高铁站 → 学校",
            "other_routes_requests": "其他路线"
        };

        for (let collection in routeCollections) {
            if (id.startsWith(collection.substring(0, 8))) {
                return collection;
            }
        }
        return "other_routes_requests"; // 默认返回“其他路线”
    },

    // ✅ 监听微信号输入框
    onWechatIdInput(e) {
        this.setData({ userWechatId: e.detail.value.trim() });
    },

    confirmAndPay() {
        const wechatId = this.data.userWechatId ? this.data.userWechatId.trim() : "";
    
        if (!wechatId) {
            wx.showToast({ title: "请填写微信号", icon: "none" });
            return;
        }
    
        const db = wx.cloud.database();
        const { carpool } = this.data;
    
        if (!carpool || !carpool._id) {
            wx.showToast({ title: "数据错误，请重试", icon: "none" });
            return;
        }
    
        const openid = wx.getStorageSync("openid");
    
        if (carpool.participants.length >= 4) {
            wx.showToast({ title: "车队已满", icon: "none" });
            return;
        }
    
        const newParticipant = { openid, wechatId };
    
        // **确保车头（发布者）在第一位**
        let updatedParticipants = [...carpool.participants, newParticipant];
        updatedParticipants.sort((a, b) => (a.openid === carpool._openid ? -1 : 1));
    
        let updatedPeopleCount = carpool.peopleCount + 1; 
    
        console.log("【更新后的 participants】:", updatedParticipants);
        console.log("【更新后的 peopleCount】:", updatedPeopleCount);
    
        db.collection(carpool.collectionName)
          .doc(carpool._id)
          .update({
              data: {
                  participants: updatedParticipants,
                  peopleCount: updatedPeopleCount,  // ✅ 正确计算 peopleCount
              }
          })
          .then(() => {
              console.log("【数据库更新成功】");
    
              // ✅ 立刻更新页面数据
              this.setData({
                  "carpool.participants": updatedParticipants,
                  "carpool.peopleCount": updatedPeopleCount
              });
    
              // ✅ 显示弹窗提示用户去“我的”页面添加车头微信
              wx.showModal({
                  title: "加入成功",
                  content: "请前往“我的”页面添加车头微信，以便联系拼车成员。",
                  showCancel: false,
                  confirmText: "去查看",
                  success: (res) => {
                      if (res.confirm) {
                          wx.switchTab({ url: "/pages/my/my" }); // 🚀 跳转到“我的”页面
                      }
                  }
              });
          })
          .catch((err) => {
              console.error("【加入拼车失败】:", err);
              wx.showToast({ title: "加入失败，请重试", icon: "none" });
          });
    }
});