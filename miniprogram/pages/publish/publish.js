Page({
    data: {
        selectedRoute: "",
        isOtherRoute: false,
        selectedDate: "",
        dateOptions: [],  // 🚀 存放未来 15 天的日期选项

        selectedHour: null,
        selectedMinute: null,
        startHour: null,
        startMinute: null,
        endHour: null,
        endMinute: null,

        hours: Array.from({ length: 24 }, (_, i) => i),
        minutes: Array.from({ length: 12 }, (_, i) => i * 5),
        peopleOptions: [1, 2, 3],
        peopleCount: "",
        wechatId: "",

        genderOptions: ["不限", "仅限男生", "仅限女生"],
        selectedGender: ""
    },

    onLoad() {
        this.setData({
            selectedRoute: wx.getStorageSync("selectedRoute"),
            isOtherRoute: wx.getStorageSync("isOtherRoute")
        });

        this.generateDateOptions();  // ✅ 生成未来 15 天的日期
    },

    // 🚀 **生成未来 15 天的可选日期**
    generateDateOptions() {
        const dateOptions = [];
        const today = new Date();

        for (let i = 0; i < 15; i++) {  // ✅ 限制 15 天
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);

            const year = futureDate.getFullYear();
            const month = (futureDate.getMonth() + 1).toString().padStart(2, "0");
            const day = futureDate.getDate().toString().padStart(2, "0");

            dateOptions.push(`${year}-${month}-${day}`);
        }

        this.setData({ dateOptions });
    },

    onDateChange(e) {
        this.setData({ selectedDate: this.data.dateOptions[e.detail.value] });
    },

    onHourChange(e) {
        this.setData({ selectedHour: Number(this.data.hours[e.detail.value]) });
    },

    onMinuteChange(e) {
        this.setData({ selectedMinute: Number(this.data.minutes[e.detail.value]) });
    },

    onStartHourChange(e) {
        this.setData({ startHour: Number(this.data.hours[e.detail.value]) });
    },

    onStartMinuteChange(e) {
        this.setData({ startMinute: Number(this.data.minutes[e.detail.value]) });
    },

    onEndHourChange(e) {
        this.setData({ endHour: Number(this.data.hours[e.detail.value]) });
    },

    onEndMinuteChange(e) {
        this.setData({ endMinute: Number(this.data.minutes[e.detail.value]) });
    },

    onPeopleCountChange(e) {
        this.setData({ peopleCount: this.data.peopleOptions[e.detail.value] });
    },

    onWechatIdChange(e) {
        this.setData({ wechatId: e.detail.value.trim() });
    },

    onGenderChange(e) {
        this.setData({ selectedGender: this.data.genderOptions[e.detail.value] });
    },

    submitForm() {
        const { selectedRoute, isOtherRoute, selectedDate, selectedHour, selectedMinute, 
                startHour, startMinute, endHour, endMinute, peopleCount, wechatId, selectedGender } = this.data;
    
        if (!selectedDate || selectedHour === null || selectedMinute === null ||
            startHour === null || startMinute === null ||
            endHour === null || endMinute === null ||
            peopleCount === "" || wechatId === "" || !selectedGender) {
            wx.showToast({ title: "请填写完整信息", icon: "none" });
            return;
        }
    
        const bestTime = `${selectedHour.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
        const startTime = `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`;
        const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
    
        const bestTimeValue = selectedHour * 60 + selectedMinute;
        const startTimeValue = startHour * 60 + startMinute;
        const endTimeValue = endHour * 60 + endMinute;
    
        // ✅ 校验最佳时间必须在可接受时间区间内
        if (bestTimeValue < startTimeValue || bestTimeValue > endTimeValue) {
            wx.showToast({ title: "最佳时间必须在可接受时间区间中", icon: "none" });
            return;
        }
    
        const collectionName = isOtherRoute ? "other_routes_requests" : `${selectedRoute}_requests`;
        const openid = wx.getStorageSync("openid"); // ✅ 获取用户 OpenID
    
        let data = { 
            date: selectedDate, 
            bestTime, 
            timeRange: `${startTime} - ${endTime}`, 
            peopleCount: Number(peopleCount),  
            wechatId,
            collectionName,
            genderRequirement: selectedGender, // ✅ 存入性别要求
            participants: [{ openid, wechatId }]
        };
    
        if (isOtherRoute) {
            data.routeName = selectedRoute;
        }
        


        console.log("【即将写入数据库的拼车数据】:", data);
    
        // ✅ 在提交之前调用支付功能，支付成功后再发布拼车信息
        this.initiatePayment(openid, data);
    },

    
    
    // 🚀 **支付初始化函数**
    initiatePayment(openid, carpoolData) {
        // 调用云函数发起支付请求
        wx.cloud.callFunction({
            name: 'wxpayFunctions',
            data: {
                type: 'wxpay_order',
                openid: openid, // 传递用户openid
                carpoolData: carpoolData // 传递拼车信息数据
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
                        
                        // 支付成功后再将拼车数据保存到数据库
                        wx.cloud.database().collection(carpoolData.collectionName)
                            .add({ data: carpoolData })
                            .then(res => {
                                console.log("拼车信息发布成功", res);
                                wx.showToast({ title: "发布成功" });
                                wx.switchTab({ url: "/pages/my/my" });
    
                                // 支付成功后调用云函数更新用户发布统计
                                console.log("【准备调用 updatePublishStats】", {
                                    openid: openid,
                                    carpoolInfo: carpoolData
                                });
    
                                wx.cloud.callFunction({
                                    name: 'updatePublishStats',
                                    data: {
                                        openid: openid,
                                        carpoolInfo: carpoolData
                                    },
                                    success: (updateRes) => {
                                        console.log("发布统计更新成功", updateRes);
                                    },
                                    fail: (err) => {
                                        console.error("发布统计更新失败", err);
                                    }
                                });
                            })
                            .catch(err => {
                                console.error("发布失败", err);
                                wx.showToast({ title: "发布失败，请重试", icon: "none" });
                            });
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
    }
    
});
