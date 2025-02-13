Page({
    data: {
        carpool: null,
        openid: "",
        isHead: false,
        isJoined: false // 🚀 判断用户是否在该拼车内
    },

    onLoad() {
        const openid = wx.getStorageSync("openid");
        let carpool = wx.getStorageSync("selectedCarpool");  
        console.log("【接收的拼车信息】:", carpool);
    
        if (!carpool) {
            wx.showToast({ title: "数据错误，请返回", icon: "none" });
            wx.navigateBack();
            return;
        }
    
        // **确保车头在第一位**
        if (carpool.participants && carpool.participants.length > 0) {
            carpool.participants.sort((a, b) => (a.openid === carpool._openid ? -1 : 1));
        }
    
        // **为车队成员加上角色标签**
        carpool.participants = carpool.participants.map((member, index) => {
            return {
                ...member,
                role: index === 0 ? "🚀 车头" : `👤 成员 ${index}`
            };
        });
    
        // 🚀 **判断当前用户是否在该拼车中**
        const isJoined = carpool.participants.some(member => member.openid === openid);
    
        // 🚀 **判断当前用户是否是车头**
        const isHead = carpool.participants.length > 0 && carpool.participants[0].openid === openid;
    
        // 🚀 **确保 hidden 字段有值**
        if (carpool.hidden === undefined) {
            carpool.hidden = false; // 默认不隐藏
        }
    
        this.setData({ carpool, openid, isJoined, isHead });
    },

    // 🚀 **切换拼车的隐藏状态**
  toggleVisibility() {
    const { carpool } = this.data;
    const newHiddenState = !carpool.hidden; // 取反

    wx.cloud.database().collection(carpool.collectionName)
      .doc(carpool._id)
      .update({
        data: { hidden: newHiddenState }
      })
      .then(() => {
        wx.showToast({ title: newHiddenState ? "已隐藏拼车" : "拼车已恢复", icon: "success" });

        this.setData({ [`carpool.hidden`]: newHiddenState });
      })
      .catch(err => {
        console.error("【隐藏拼车失败】:", err);
        wx.showToast({ title: "操作失败，请重试", icon: "none" });
      });
  },

    copyWechat(e) {
        const wechatId = e.currentTarget.dataset.wechat;
        console.log("【复制微信号】:", wechatId);

        wx.setClipboardData({
            data: wechatId,
            success() {
                wx.showToast({ title: "微信号已复制", icon: "success" });
            },
            fail(err) {
                console.error("【复制失败】:", err);
                wx.showToast({ title: "复制失败", icon: "none" });
            }
        });
    },

    // 🚀 **跳转到退出拼车页面**
    goToExit() {
        console.log("🚪 退出拼车，拼车ID:", this.data.carpool._id, "集合:", this.data.carpool.collectionName);
    
        if (!this.data.carpool._id || !this.data.carpool.collectionName) {
            wx.showToast({ title: "数据错误，无法退出", icon: "none" });
            return;
        }

        wx.navigateTo({
            url: `/pages/exit/exit?id=${this.data.carpool._id}&collection=${this.data.carpool.collectionName}`
        });
    }
});