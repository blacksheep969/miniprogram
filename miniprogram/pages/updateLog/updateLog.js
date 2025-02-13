Page({
    data: {
      updateLogs: [] // 存储更新日志
    },
  
    onLoad() {
      wx.cloud.init(); // 🚀 确保云开发初始化
      this.fetchUpdateLogs();
    },
  
    fetchUpdateLogs() {
      const db = wx.cloud.database(); // ✅ 在这里初始化数据库
  
      db.collection("update_logs")
        .orderBy("date", "desc") // 🚀 按发布日期倒序排列
        .get()
        .then(res => {
          console.log("【更新日志】", res.data);
          this.setData({ updateLogs: res.data });
        })
        .catch(err => {
          console.error("获取更新日志失败:", err);
          wx.showToast({ title: "加载失败", icon: "none" });
        });
    }
  });
  