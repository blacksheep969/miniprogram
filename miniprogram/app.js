App({
    globalData: {
        openid: ""  // 存放全局 openid，方便在任何页面访问
    },
    
    onLaunch() {
        wx.cloud.init({
            env: "blacksheep-6g40uxj910ea868f", 
            traceUser: true
        });

        console.log("【小程序启动】云开发初始化完成");

        this.getUserOpenid();  // 获取 openid
    },

    getUserOpenid(retry = 2) {  // 允许重试 2 次
        wx.cloud.callFunction({
            name: "login",
            success: res => {
                console.log("【小程序调用】完整返回数据:", res);
                
                if (res.result && res.result.openid) {  
                    console.log("【小程序调用】获取到 openid:", res.result.openid);
                    this.globalData.openid = res.result.openid;
                    wx.setStorageSync("openid", res.result.openid);
                    
                    // 调用云函数来确保初始化用户统计数据
                    this.initUserStats(this.globalData.openid);  // 调用初始化用户统计数据的云函数
                } else {
                    console.error("【小程序调用】openid 获取失败:", res);
                    if (retry > 0) {
                        console.log("【重试获取 openid】剩余次数:", retry);
                        this.getUserOpenid(retry - 1);
                    } else {
                        wx.showToast({ title: "登录失败，请重试", icon: "none" });
                    }
                }
            },
            fail: err => {
                console.error("【小程序调用】登录失败:", err);
                if (retry > 0) {
                    console.log("【重试获取 openid】剩余次数:", retry);
                    this.getUserOpenid(retry - 1);
                } else {
                    wx.showToast({ title: "登录失败，请重试", icon: "none" });
                }
            }
        });
    },

    // 直接调用云函数来初始化用户数据，不再在本地进行查询
    initUserStats(openid) {
        wx.cloud.callFunction({
            name: "initUserStats",  // 调用云函数初始化用户数据
            data: { openid },
            success: res => {
                console.log("用户统计数据初始化成功", res);
            },
            fail: err => {
                console.error("初始化用户统计数据失败:", err);
            }
        });
    }
});
