Page({
    data: {
      myCarpools: []
    },

    onLoad() {
      const openid = wx.getStorageSync("openid");
      console.log("【当前用户 OpenID】:", openid);

      if (!openid) {
        wx.showToast({ title: "请重新登录", icon: "none" });
        return;
      }

      this.loadMyCarpools(openid);
    },

    loadMyCarpools(openid) {
      console.log("【查询拼车信息】");

      const db = wx.cloud.database();
      const collections = [
        "schoolToJZ_requests",
        "JZToSchool_requests",
        "schoolToTrain_requests",
        "trainToSchool_requests",
        "other_routes_requests"
      ];

      // ✅ 映射集合名到中文
      const routeMap = {
        "schoolToJZ_requests": "学校 → 九州",
        "JZToSchool_requests": "九州 → 学校",
        "schoolToTrain_requests": "学校 → 高铁站",
        "trainToSchool_requests": "高铁站 → 学校",
        "other_routes_requests": "其他路线"
      };

      let myCarpools = [];

      const promises = collections.map(collection =>
        db.collection(collection)
          .where({
            participants: db.command.elemMatch({ openid: openid })
          })
          .get()
          .then(res => {
            console.log(`【${collection} 查询结果】`, res.data);
            myCarpools = myCarpools.concat(res.data.map(item => ({
              ...item,
              routeName: item.routeName || routeMap[collection], // ✅ 转换成中文
              collectionName: collection
            })));
          })
      );

      Promise.all(promises)
        .then(() => {
          console.log("【我的拼车】:", myCarpools);
          this.setData({ myCarpools });

          if (myCarpools.length === 0) {
            wx.showToast({ title: "没有找到您的拼车", icon: "none" });
          }
        })
        .catch(err => {
          console.error("【查询拼车失败】:", err);
          wx.showToast({ title: "查询失败，请重试", icon: "none" });
        });
    },
    loadMyCarpools(openid) {
        console.log("【查询拼车信息】");
    
        const db = wx.cloud.database();
        const collections = [
            "schoolToJZ_requests",
            "JZToSchool_requests",
            "schoolToTrain_requests",
            "trainToSchool_requests",
            "other_routes_requests"
        ];
    
        // ✅ 映射集合名到中文
        const routeMap = {
            "schoolToJZ_requests": "学校 → 九州",
            "JZToSchool_requests": "九州 → 学校",
            "schoolToTrain_requests": "学校 → 高铁站",
            "trainToSchool_requests": "高铁站 → 学校",
            "other_routes_requests": "其他路线"
        };
    
        let myCarpools = [];
    
        const promises = collections.map(collection => {
            let condition = db.command.or([
                { _openid: openid }, // ✅ 查询自己发布的拼车
                { participants: db.command.elemMatch({ openid: openid }) } // ✅ 查询自己加入的拼车
            ]);
    
            return db.collection(collection)
                .where(condition)
                .get()
                .then(res => {
                    myCarpools = myCarpools.concat(res.data.map(item => ({
                        ...item,
                        routeName: item.routeName || routeMap[collection], // ✅ 确保 routeName 是中文
                        collectionName: collection
                    })));
                });
        });
    
        Promise.all(promises)
            .then(() => {
                console.log("【我的拼车】:", myCarpools);
                this.setData({ myCarpools });
    
                if (myCarpools.length === 0) {
                    wx.showToast({ title: "没有找到您的拼车", icon: "none" });
                }
            })
            .catch(err => {
                console.error("【查询拼车失败】:", err);
                wx.showToast({ title: "查询失败，请重试", icon: "none" });
            });
    },
    // ✅ 确保 `viewDetails()` 方法存在，并正确跳转
    viewDetails(e) {
        const index = e.currentTarget.dataset.index;
        console.log("【点击的索引】:", index);
    
        const selectedCarpool = this.data.myCarpools[index];
        console.log("【点击的拼车信息】:", selectedCarpool);
    
        if (!selectedCarpool) {
            wx.showToast({ title: "数据错误，无法查看详情", icon: "none" });
            return;
        }
    
        wx.setStorageSync("selectedCarpool", selectedCarpool);  // ✅ 确保数据存入本地存储
        wx.navigateTo({
            url: "/pages/carpoolDetail/carpoolDetail"
        });
    }
});