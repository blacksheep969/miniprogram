Page({
    data: {
        myCarpools: []
    },

    onShow() {  
        this.loadMyCarpools();
    },

    // 🚀 **支持下拉刷新**
    onPullDownRefresh() {
        console.log("【触发下拉刷新】");
        this.loadMyCarpools(() => {
            wx.stopPullDownRefresh(); // ✅ 结束下拉刷新动画
        });
    },

    loadMyCarpools(callback) {
        console.log("【查询拼车信息】");

        const db = wx.cloud.database();
        const openid = wx.getStorageSync("openid"); // ✅ 获取当前用户 openid

        const collections = [
            "schoolToJZ_requests",
            "JZToSchool_requests",
            "schoolToTrain_requests",
            "trainToSchool_requests",
            "other_routes_requests"
        ];

        const routeMap = {
            "schoolToJZ_requests": "学校 → 九州",
            "JZToSchool_requests": "九州 → 学校",
            "schoolToTrain_requests": "学校 → 高铁站",
            "trainToSchool_requests": "高铁站 → 学校",
            "other_routes_requests": "其他路线"
        };

        let myCarpools = [];

        // ✅ **计算 2 天前的日期**
        const today = new Date();
        today.setDate(today.getDate() - 2);
        const threeDaysAgo = today.toISOString().split("T")[0]; // **格式化为 YYYY-MM-DD**

        const promises = collections.map(collection => {
            return db.collection(collection)
                .where({
                    date: db.command.gte(threeDaysAgo),  // ✅ 过滤掉 2 天前的数据
                    participants: db.command.elemMatch({ openid: openid })  // ✅ 只查询用户仍然在 `participants` 里的拼车
                })
                .get()
                .then(res => {
                    console.log(`【${collection} 查询结果】`, res.data);
                    myCarpools = myCarpools.concat(res.data.map(item => {
                        return {
                            ...item,
                            routeName: item.routeName || routeMap[collection], // ✅ 转换成中文
                            collectionName: collection,
                            isHead: item.participants.length > 0 && item.participants[0].openid === openid, // 🚀 **判断是否是车头**
                            luggageLoad: item.luggageLoad || 0 // ✅ 确保行李信息正确存储
                        };
                    }));
                });
        });

        Promise.all(promises)
            .then(() => {
                console.log("【我的拼车（过滤后）】:", myCarpools);
                this.setData({ myCarpools });

                if (myCarpools.length === 0) {
                    wx.showToast({ title: "没有找到您的拼车", icon: "none" });
                }

                if (callback) {
                    setTimeout(() => {
                        wx.stopPullDownRefresh(); // ✅ 确保动画停止
                    }, 500);
                }
            })
            .catch(err => {
                console.error("【查询拼车失败】:", err);
                wx.showToast({ title: "查询失败，请重试", icon: "none" });

                if (callback) {
                    setTimeout(() => {
                        wx.stopPullDownRefresh(); // ✅ 确保动画停止
                    }, 500);
                }
            });
    },

    viewDetails(e) {
        const index = e.currentTarget.dataset.index;
        console.log("【点击的索引】:", index);

        const selectedCarpool = this.data.myCarpools[index];
        console.log("【点击的拼车信息】:", selectedCarpool);

        if (!selectedCarpool) {
            wx.showToast({ title: "数据错误，无法查看详情", icon: "none" });
            return;
        }

        wx.setStorageSync("selectedCarpool", selectedCarpool);
        wx.navigateTo({
            url: "/pages/carpoolDetail/carpoolDetail"
        });
    },
    
    goToFeedback() {
        wx.navigateTo({
          url: "/pages/feedback/feedback"
        });
      }



});