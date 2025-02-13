const db = wx.cloud.database();
const _ = db.command;

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
    dateOptions: [], // 🚀 存放未来 15 天的可选日期

    selectedGender: "",  
    genderOptions: ["男生", "女生"], 
    genderFilter: "", 

    carpoolList: [],
    selectedRoute: "",
    isOtherRoute: false,
    openid: "" 
  },

  onLoad() {
    const route = wx.getStorageSync("selectedRoute");
    const isOther = wx.getStorageSync("isOtherRoute");
    const openid = wx.getStorageSync("openid"); 

    this.setData({
      selectedRoute: isOther ? route : routeMap[route] || route,
      isOtherRoute: isOther,
      openid
    });

    this.generateDateOptions(); // 🚀 生成未来 15 天日期选项

    wx.showToast({ title: "请选择日期和性别", icon: "none" });
  },

  // 🚀 **生成未来 15 天的可选日期**
  generateDateOptions() {
    const dateOptions = [];
    const today = new Date();

    for (let i = 0; i < 15; i++) { 
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + i);

        const year = futureDate.getFullYear();
        const month = (futureDate.getMonth() + 1).toString().padStart(2, "0");
        const day = futureDate.getDate().toString().padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        dateOptions.push(`${year}-${month}-${day}`);
    }

    this.setData({ dateOptions }, () => {
      this.fetchCarpoolCounts(); // ✅ 查询每个日期的拼车数量
    });
  },


  onShow() {
    console.log("【信息大厅】页面刷新");

    if (wx.getStorageSync("carpoolUpdated")) {
      wx.setStorageSync("carpoolUpdated", false);
      this.fetchCarpools();
    }
  },

   // 🚀 **查询未来 15 天的拼车数量**
   fetchCarpoolCounts() {
    const { dateOptions, isOtherRoute } = this.data;
    let collectionName = isOtherRoute ? "other_routes_requests" : `${wx.getStorageSync("selectedRoute")}_requests`;
    
    const promises = dateOptions.map(date => {
      return db.collection(collectionName)
        .where({
          date: date,
          peopleCount: _.lt(4), // ✅ 只查询未满员的拼车
          hidden: _.neq(true) // ✅ 过滤掉隐藏的拼车
        })
        .count()
        .then(res => {
            return res.total > 0 ? { date, count: res.total } : null; // 🚀 只保留有拼车的日期
        });
    });

    Promise.all(promises).then(results => {
        let dateCarpoolCount = {};
        let filteredDateOptions = [];

        results.forEach(result => {
            if (result) {  // 🚀 **只存入有拼车记录的日期**
                dateCarpoolCount[result.date] = result.count;
                filteredDateOptions.push(result.date);
            }
        });

        console.log("【拼车数量统计】", dateCarpoolCount);
        this.setData({ dateCarpoolCount, filteredDateOptions });
    }).catch(err => {
      console.error("【查询拼车数量失败】:", err);
    });
  },

  // 🚀 **用户选择日期**
  onDateChange(e) {
    this.setData({ selectedDate: this.data.dateOptions[e.detail.value] });
    this.checkAndFetchCarpools();
  },

  // 🚀 **用户选择性别**
  onGenderChange(e) {
    const selectedGender = this.data.genderOptions[e.detail.value];
    const genderFilter = `仅限${selectedGender}`;
    
    this.setData({
      selectedGender,
      genderFilter
    });

    this.checkAndFetchCarpools();
  },

  // 🚀 **检查是否已选择日期和性别**
  checkAndFetchCarpools() {
    const { selectedDate, selectedGender } = this.data;

    if (!selectedDate || !selectedGender) {
      console.log("⚠️ 用户未选择完整信息，等待输入...");
      return;
    }

    this.fetchCarpools();
  },

  fetchCarpools() {
    const { selectedRoute, selectedDate, isOtherRoute, openid, selectedGender } = this.data;

    if (!selectedDate || !selectedGender) {
        wx.showToast({ title: "请先选择日期和性别", icon: "none" });
        return;
    }

    let collectionName = isOtherRoute ? "other_routes_requests" : `${wx.getStorageSync("selectedRoute")}_requests`;

    console.log("【正在查询拼车】集合:", collectionName, "日期:", selectedDate, "性别:", selectedGender);

    // 🚀 **查询条件**
    let genderQuery = [
        { genderRequirement: "不限" },  
        { genderRequirement: `仅限${selectedGender}` } 
    ];

    console.log("【查询条件】:", {
        date: selectedDate,
        peopleCount: db.command.lt(4),  // 🚀 **排除满员拼车**
        hidden: false,                  // 🚀 **排除隐藏拼车**
        $or: genderQuery 
    });

    db.collection(collectionName)
      .where({
        date: selectedDate,
        peopleCount: db.command.lt(4), // 🚀 **排除满员拼车**
        hidden: false,                 // 🚀 **排除隐藏拼车**
        $or: genderQuery  
      })
      .get()
      .then(res => {
        console.log("【最新拼车数据】:", res.data);

        const processedData = res.data.map(item => ({
          ...item,
          isMyPost: item.participants && item.participants.some(p => p.openid === openid),
          luggageLoad: item.luggageLoad || 0  // ✅ 确保 `luggageLoad` 正确传递
        }));

        this.setData({ carpoolList: processedData });
      })
      .catch(err => {
        console.error("【查询失败】:", err);
        wx.showToast({ title: "加载失败", icon: "none" });
      });
},

  joinCarpool(e) {
    const id = e.currentTarget.dataset.id;
    const isMyPost = e.currentTarget.dataset.myPost;

    if (isMyPost) {
      wx.showToast({ title: "这是您发布的拼车", icon: "none" });
      return;
    }

    console.log("【点击的拼车 ID】:", id);

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