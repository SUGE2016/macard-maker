import { useRef } from 'react';
import { CardPreview, type CardPreviewRef } from './CardPreview';
import { useCardStore } from '../store/cardStore';
import { saveCard, generateImage } from '../services/api';
import { toPng } from 'html-to-image';

export function PreviewArea() {
  const cardRef = useRef<CardPreviewRef>(null);
  const {
    config,
    blessingText,
    imageUrl,
    setImageUrl,
    setIsGeneratingImage,
    token,
    addHistoryItem,
  } = useCardStore();

  // AI 生成图片
  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      // ECNU 支持的尺寸: 512x512, 768x768, 1024x1024, 720x1280, 1280x720
      let width: number, height: number;
      
      if (config.aspectRatio === '1:1') {
        width = 512;
        height = 512;
      } else if (config.aspectRatio === '16:9') {
        if (config.orientation === 'horizontal') {
          width = 1280;
          height = 720;
        } else {
          width = 720;
          height = 1280;
        }
      } else {
        // 4:3 等其他比例用 1024x1024 裁剪
        width = 1024;
        height = 1024;
      }
      
      const response = await generateImage('', width, height);
      setImageUrl(response.image_url);
    } catch (err) {
      console.error('生成图片失败:', err);
      alert('生成图片失败，请重试');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 下载贺卡（同时自动保存到云端）
  const handleDownload = async () => {
    const element = cardRef.current?.getCanvas();
    if (!element) {
      console.error('下载失败: 无法获取贺卡元素');
      return;
    }

    try {
      console.log('开始截图...');
      const imageData = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: config.showBorder ? '#ffffff' : undefined,
        filter: (node) => {
          // 排除带有 data-exclude-export 属性的元素（如删除按钮）
          if (node instanceof HTMLElement && node.dataset.excludeExport === 'true') {
            return false;
          }
          return true;
        },
      });
      console.log('截图完成');
      
      // 下载到本地
      const link = document.createElement('a');
      link.download = `贺卡_${Date.now()}.png`;
      link.href = imageData;
      link.click();
      console.log('下载完成');
      
      // 自动保存到云端（已登录时）
      if (token) {
        try {
          const response = await saveCard(imageData, config, blessingText);
          addHistoryItem({
            id: response.id,
            image_url: response.image_url,
            thumbnail_url: null,
            config,
            blessing_text: blessingText,
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          console.error('自动保存失败:', err);
        }
      }
    } catch (err: unknown) {
      console.error('下载失败:', err);
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      alert(`下载失败: ${errorMessage}`);
    }
  };

  return (
    <div className="flex items-center justify-center">
      {/* 贺卡预览 + 下载按钮容器 */}
      <div className="relative">
        <CardPreview ref={cardRef} onGenerateImage={handleGenerateImage} />
        
        {/* 下载按钮 - 相对于贺卡定位 */}
        <button
          onClick={handleDownload}
          disabled={!imageUrl}
          className="absolute -top-2 -right-14 w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all cursor-pointer z-20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-md"
          title="下载贺卡"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
