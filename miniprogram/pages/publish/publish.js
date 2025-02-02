Page({
    data: {
      selectedRoute: "",
      isOtherRoute: false,
      date: "",

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
      wechatId: ""
    },

    onLoad() {
        
      this.setData({
        selectedRoute: wx.getStorageSync("selectedRoute"),
        isOtherRoute: wx.getStorageSync("isOtherRoute")
      });
    },

    onDateChange(e) {
      this.setData({ date: e.detail.value });
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

    submitForm() {
        const { selectedRoute, isOtherRoute, date, selectedHour, selectedMinute, startHour, startMinute, endHour, endMinute, peopleCount, wechatId } = this.data;
    
        if (!date || selectedHour === null || selectedMinute === null ||
            startHour === null || startMinute === null ||
            endHour === null || endMinute === null ||
            peopleCount === "" || wechatId === "") {
            wx.showToast({ title: "请填写完整信息", icon: "none" });
            return;
        }
    
        const bestTime = `${selectedHour.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
        const startTime = `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`;
        const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
    
        const bestTimeValue = selectedHour * 60 + selectedMinute;
        const startTimeValue = startHour * 60 + startMinute;
        const endTimeValue = endHour * 60 + endMinute;
    
        // ✅ 获取当前时间，并转换为分钟数
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 月份从 0 开始，需要 +1
        const currentDay = now.getDate();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeValue = currentHour * 60 + currentMinute;
    
        // ✅ 判断用户选择的日期是否是今天
        const selectedDateParts = date.split("-");
        const selectedYear = parseInt(selectedDateParts[0], 10);
        const selectedMonth = parseInt(selectedDateParts[1], 10);
        const selectedDay = parseInt(selectedDateParts[2], 10);
    
        // ✅ 如果用户选择的是今天，检查时间是否早于当前时间
        if (selectedYear === currentYear && selectedMonth === currentMonth && selectedDay === currentDay) {
            if (bestTimeValue < currentTimeValue) {
                wx.showToast({ title: "最佳时间不能早于当前时间", icon: "none" });
                return;
            }
        }
    
        // ✅ 校验最佳时间必须在可接受时间区间内
        if (bestTimeValue < startTimeValue || bestTimeValue > endTimeValue) {
            wx.showToast({ title: "最佳时间必须在可接受时间区间中", icon: "none" });
            return;
        }
    
        let collectionName = isOtherRoute ? "other_routes_requests" : `${selectedRoute}_requests`;
    
        let openid = wx.getStorageSync("openid"); // 获取当前用户 OpenID
    
        let data = { 
            date, 
            bestTime, 
            timeRange: `${startTime} - ${endTime}`, 
            peopleCount: Number(peopleCount),  // ✅ 确保 `peopleCount` 是数字
            wechatId,
            collectionName,
            participants: [{ openid, wechatId }]  // ✅ 记录发布者
        };
    
        if (isOtherRoute) {
            data.routeName = selectedRoute;
        }
    
        console.log("【即将写入数据库的拼车数据】:", data);
    
        wx.cloud.database().collection(collectionName)
          .add({ data })
          .then(res => {
              console.log("【发布成功，返回的 _id】:", res._id);
              wx.showToast({ title: "发布成功" });
              wx.navigateBack();
          })
          .catch(err => {
              console.error("【发布失败】:", err);
              wx.showToast({ title: "发布失败", icon: "none" });
          });
    }
});