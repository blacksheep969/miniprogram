const db = wx.cloud.database();

// 线路映射表（routeId → 中文名称）
const routeMap = {
  schoolToJZ: "学校 → 九州",
  JZToSchool: "九州 → 学校",
  schoolToTrain: "学校 → 高铁站",
  trainToSchool: "高铁站 → 学校"
};

Page({
  data: {
    selectedDate: "",
    carpoolList: [],
    selectedRoute: "",
    isOtherRoute: false
  },
  
  onLoad() {
    const route = wx.getStorageSync("selectedRoute");
    const isOther = wx.getStorageSync("isOtherRoute");

    this.setData({
      selectedRoute: isOther ? route : routeMap[route] || route, // 若是其他路线，直接显示
      isOtherRoute: isOther
    });

    this.fetchCarpools();
  },
  onShow() {
    console.log("【信息大厅】页面刷新");

    // 🚀 如果有新加入的拼车，自动刷新
    if (wx.getStorageSync("carpoolUpdated")) {
        wx.setStorageSync("carpoolUpdated", false);
        this.fetchCarpools();
    }
},
  onDateChange(e) {
    this.setData({ selectedDate: e.detail.value });
    this.fetchCarpools();
  },

  fetchCarpools() {
    const { selectedRoute, selectedDate, isOtherRoute } = this.data;
    let collectionName = isOtherRoute ? "other_routes_requests" : `${wx.getStorageSync("selectedRoute")}_requests`;

    wx.cloud.database().collection(collectionName)
      .where({
        date: selectedDate,
        peopleCount: wx.cloud.database().command.lt(4),  // 🚀 过滤掉已满的拼车
        status: wx.cloud.database().command.neq("full") // 🚀 备用状态字段
      })
      .get()
      .then(res => {
          console.log("【最新拼车数据】:", res.data);
          this.setData({ carpoolList: res.data });
      })
      .catch(() => {
          wx.showToast({ title: "加载失败", icon: "none" });
      });
},

joinCarpool(e) {
    const id = e.currentTarget.dataset.id;
    console.log("【点击的拼车 ID】:", id);  // ✅ 确保 id 不是空

    if (!id) {
        wx.showToast({ title: "数据错误，无法加入", icon: "none" });
        return;
    }

    wx.navigateTo({ url: `/pages/receive/receive?id=${id}` });
},

  goToPublish() {
    wx.navigateTo({ url: "/pages/publish/publish" });
  }
});