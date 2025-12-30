/**
 * 前端配置文件
 * 集中管理默认值，方便统一修改
 */

// 贺卡默认配置
export const CARD_CONFIG = {
  // 默认祝福语
  defaultBlessingText: '岁岁常欢愉，年年皆胜意',
  
  // 默认组织名称
  defaultOrganizationName: '华东师范大学',
  
  // 默认宽高比
  defaultAspectRatio: '4:3' as const,
  
  // 默认方向
  defaultOrientation: 'vertical' as const,
  
  // 默认显示选项
  defaultShowBorder: true,
  defaultShowLogo: true,
  defaultShowQrCode: true,
};

// 图片区域配置
export const IMAGE_CONFIG = {
  // 图片区域基准短边长度
  baseShortSide: 320,
  
  // AI 生成图片基础尺寸
  aiGenerateBaseSize: 512,
};

// 预览区域配置
export const PREVIEW_CONFIG = {
  // 预览容器最大高度
  containerHeight: 720,
};

// UI 文案配置
export const UI_TEXT = {
  // 占位符文案
  blessingPlaceholder: '输入祝福语...',
  organizationPlaceholder: '输入学校/机构名称...',
  
  // 按钮文案
  generateImageBtn: 'AI 生成图片',
  generatingImageBtn: '生成中...',
  downloadBtn: '下载贺卡',
  saveBtn: '保存到云端',
  savingBtn: '保存中...',
  generateTextBtn: '自动生成',
  clearBtn: '清空',
  loginBtn: '登录',
  logoutBtn: '退出',
  
  // 提示文案
  uploadHint: '点击上传图片',
  aiGenerateHint: '或使用 AI 生成',
  loginToViewHistory: '登录后查看历史记录',
  noHistory: '暂无历史记录',
};

