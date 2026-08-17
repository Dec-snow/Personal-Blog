export const ownerConsoleScreens = [
  {
    id: "home",
    navLabel: "总览",
    icon: "H",
    title: "后端控制台",
    subtitle: "管理随笔与相册内容，监控后端状态。",
  },
  {
    id: "moments",
    navLabel: "随笔",
    icon: "S",
    title: "发布随笔",
    subtitle: "填写分类和内容，可附图片，直接写入首页随笔。",
  },
  {
    id: "gallery",
    navLabel: "相册",
    icon: "G",
    title: "相册图片",
    subtitle: "上传图片到 COS，并把图片发布到站内相册。",
  },
];

export const ownerConsoleModules = [
  {
    id: "moments",
    title: "发布随笔",
    description: "填写分类和内容，可附图片，提交到首页导航里的随笔页。",
    icon: "S",
    tone: "sun",
    status: "轻量发布",
  },
  {
    id: "gallery",
    title: "相册图片",
    description: "选择相册、上传 COS，并发布到站内相册数据。",
    icon: "G",
    tone: "green",
    status: "待上传 0",
  },
];

export const ownerConsoleNotifications = [];

export const ownerConsoleAvatars = [
  {
    id: "tc",
    label: "后端控制台",
    initial: "控",
    gradient: "linear-gradient(135deg, #c97d8a, #d4a090)",
  },
  {
    id: "owner",
    label: "站长",
    initial: "站",
    gradient: "linear-gradient(135deg, #d895a0, #e0b878)",
  },
  {
    id: "gallery",
    label: "相册",
    initial: "G",
    gradient: "linear-gradient(135deg, #a8c8b8, #c8b8a8)",
  },
];

export const publishSteps = [
  "检查内容",
  "上传图片",
  "生成页面",
  "发布到网站",
  "检查线上结果",
];

export function getNotificationTotal(notifications = ownerConsoleNotifications) {
  return notifications.reduce((total, item) => total + (item.count || 0), 0);
}
