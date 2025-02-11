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

    // **确认加入并支付**
    confirmAndPay() {
        const wechatId = this.data.userWechatId ? this.data.userWechatId.trim() : "";
        
        if (!wechatId) {
            wx.showToast({ title: "请填写微信号", icon: "none" });
            return;
        }
    
        const { carpool } = this.data;
        const openid = wx.getStorageSync("openid");
    
        console.log("【即将调用云函数】joinCarpool");
        console.log("【参数】:", {
            carpoolId: carpool._id,
            userOpenid: openid,
            userWechatId: wechatId,
            collectionName: carpool.collectionName
        });
    
        // ✅ 调用支付功能
        this.initiatePayment(openid, carpool, wechatId);
    },




    // **调用支付功能**
    initiatePayment(openid, carpoolData, wechatId) {
        wx.cloud.callFunction({
            name: 'wxpayFunctions',
            data: {
                type: 'wxpay_order',
                openid: openid,
                carpoolData: carpoolData
            },
            success: (res) => {
                console.log("下单结果: ", res);
                const paymentData = res.result?.data;
                
                // 调用微信支付组件
                wx.requestPayment({
                    timeStamp: paymentData?.timeStamp,
                    nonceStr: paymentData?.nonceStr,
                    package: paymentData?.packageVal,
                    paySign: paymentData?.paySign,
                    signType: 'RSA',
                    success: (payRes) => {
                        console.log('支付成功：', payRes);
                        
                        // 支付成功后再调用加入拼车的云函数
                        this.joinCarpool(openid, carpoolData, wechatId);
                    },
                    fail: (err) => {
                        console.error('支付失败：', err);
                        wx.showToast({ title: "支付失败，请重试", icon: "none" });
                    }
                });
            },
            fail: (err) => {
                console.error("支付请求失败", err);
                wx.showToast({ title: "支付请求失败，请重试", icon: "none" });
            }
        });
    },

    // **加入拼车**
    joinCarpool(openid, carpoolData, wechatId) {
        wx.cloud.callFunction({
            name: "joinCarpool",
            data: {
                carpoolId: carpoolData._id,
                userOpenid: openid,
                userWechatId: wechatId,
                collectionName: carpoolData.collectionName
            },
            success: res => {
                console.log("【完整的云函数返回数据】:", res);
    
                if (res.result && res.result.success) {
                    wx.showModal({
                        title: "加入成功",
                        content: "请前往“我的”页面添加车头微信，以便联系拼车成员。",
                        showCancel: false,
                        confirmText: "去查看",
                        success: (res) => {
                            if (res.confirm) {
                                wx.switchTab({ url: "/pages/my/my" });
                            }
                        }
                    });

                    // **更新加入统计**：更新用户的加入次数
                    this.updateJoinStats(openid);
                } else {
                    console.warn("【云函数返回失败】:", res.result);
                    wx.showToast({ title: res.result?.message || "加入失败，请重试", icon: "none" });
                }
            },
            fail: err => {
                console.error("【云函数调用失败】:", err);
                wx.showToast({ title: "加入失败，请重试", icon: "none" });
            }
        });
    },

    // **更新加入统计**
    updateJoinStats(openid) {
        wx.cloud.callFunction({
            name: 'updateJoinStats',  // 这个云函数会增加“加入次数”
            data: {
                openid
            },
            success: res => {
                console.log("加入统计更新成功", res);
            },
            fail: err => {
                console.error("加入统计更新失败", err);
            }
        });
    }
});
