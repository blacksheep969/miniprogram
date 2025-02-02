App({
    globalData: {
        openid: ""  // ✅ 存放全局 openid，方便在任何页面访问
    },

    onLaunch() {
        wx.cloud.init({
            env: "blacksheep-0g412ktla7b844f6", // ✅ 确保是你的云开发环境 ID
            traceUser: true
        });

        this.getUserOpenid();
    },

    getUserOpenid() {
        wx.cloud.callFunction({
            name: "login",
            success: res => {
                console.log("【小程序调用】完整返回数据:", res);
                
                if (res.result && res.result.openid) {  // ✅ 确保 openid 存在
                    console.log("【小程序调用】获取到 openid:", res.result.openid);
                    this.globalData.openid = res.result.openid;  // ✅ 存入全局变量
                    wx.setStorageSync("openid", res.result.openid);
                } else {
                    console.error("【小程序调用】openid 获取失败，返回数据异常:", res);
                    wx.showToast({ title: "登录失败，请重试", icon: "none" });
                }
            },
            fail: err => {
                console.error("【小程序调用】登录失败:", err);
                wx.showToast({ title: "登录失败，请重试", icon: "none" });
            }
        });
    }
});