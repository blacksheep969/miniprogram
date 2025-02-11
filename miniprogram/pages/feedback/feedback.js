Page({
    data: {
      feedback: "", // 存储用户的反馈内容
      wechatId: "MY_BLACKSHEEP" // 研发小哥的微信号
    },
  
    // 监听反馈输入
    onFeedbackInput(e) {
      this.setData({ feedback: e.detail.value });
    },
  
    // 提交反馈
    submitFeedback() {
        const { feedback } = this.data;
      
        if (!feedback.trim()) {
          wx.showToast({ title: "反馈内容不能为空", icon: "none" });
          return;
        }
      
        // 调用云函数提交反馈
        wx.cloud.callFunction({
          name: "submitFeedback", // 确保函数名称与云函数一致
          data: { feedback },
          success: (res) => {
            console.log("反馈提交成功", res);
            if (res.result && res.result.success) {
              wx.showToast({ title: "感谢您的反馈！", icon: "success" });
              this.setData({ feedback: "" }); // 清空输入框
            } else {
              wx.showToast({ title: "提交失败，请重试", icon: "none" });
            }
          },
          fail: (err) => {
            console.error("反馈提交失败", err);
            wx.showToast({ title: "提交失败，请重试", icon: "none" });
          }
        });
      },
      
  
    // 复制微信号
    copyWechatId() {
      wx.setClipboardData({
        data: this.data.wechatId,
        success: () => {
          wx.showToast({ title: "微信号已复制", icon: "success" });
        },
        fail: (err) => {
          console.error("复制失败", err);
          wx.showToast({ title: "复制失败", icon: "none" });
        }
      });
    }
});
