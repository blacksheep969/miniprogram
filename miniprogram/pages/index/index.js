Page({
    data: {
        showOtherRoute: false,
        otherRouteName: "",
        allowOtherRoutes: false // 🚀 未来改成 `true` 即可开放
    },

    selectRoute(event) {
        const route = event.currentTarget.dataset.route;
        wx.setStorageSync("selectedRoute", route);
        wx.setStorageSync("isOtherRoute", false);
        wx.navigateTo({ url: "/pages/hall/hall" });
    },

    toggleOtherRoute() {
        if (!this.data.allowOtherRoutes) {  // 🚀 未来开放时只需改 `allowOtherRoutes`
            wx.showToast({ title: "暂未开放", icon: "none" });
            return;
        }
        this.setData({ showOtherRoute: !this.data.showOtherRoute });
    },

    onInputChange(event) {
        this.setData({ otherRouteName: event.detail.value });
    },

    confirmOtherRoute() {
        if (!this.data.allowOtherRoutes) {  // 🚀 确保输入自定义路线时也检查
            wx.showToast({ title: "暂未开放", icon: "none" });
            return;
        }
        if (!this.data.otherRouteName.trim()) {
            wx.showToast({ title: "请输入路线", icon: "none" });
            return;
        }
        wx.setStorageSync("selectedRoute", this.data.otherRouteName);
        wx.setStorageSync("isOtherRoute", true);
        wx.navigateTo({ url: "/pages/hall/hall" });
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
});