import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { useCardStore } from '../store/cardStore';
import { PREVIEW_CONFIG, IMAGE_CONFIG } from '../config';
import { ProgressRing } from './ProgressRing';

export interface CardPreviewRef {
  getCanvas: () => HTMLDivElement | null;
}

interface CardPreviewProps {
  onGenerateImage?: () => void;
}

export const CardPreview = forwardRef<CardPreviewRef, CardPreviewProps>(function CardPreview({ onGenerateImage }, ref) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { config, blessingText, imageUrl, setImageUrl, organizationName, isGeneratingImage } = useCardStore();
  const [wasGenerating, setWasGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // 检测生成完成
  useEffect(() => {
    if (isGeneratingImage) {
      setWasGenerating(true);
      setIsComplete(false);
    } else if (wasGenerating && imageUrl) {
      // 刚完成生成
      setIsComplete(true);
      setTimeout(() => {
        setWasGenerating(false);
        setIsComplete(false);
      }, 500);
    } else if (!isGeneratingImage) {
      setWasGenerating(false);
    }
  }, [isGeneratingImage, imageUrl, wasGenerating]);

  useImperativeHandle(ref, () => ({
    getCanvas: () => cardRef.current,
  }));

  // 计算尺寸（横竖切换保持面积一致，只交换宽高）
  const calculateSizes = () => {
    const maxHeight = PREVIEW_CONFIG.containerHeight - 40;
    const baseShortSide = IMAGE_CONFIG.baseShortSide;
    const [w, h] = config.aspectRatio.split(':').map(Number);
    const ratio = Math.max(w, h) / Math.min(w, h); // 长边/短边
    
    // 计算图片尺寸：基于短边计算，横竖切换只是交换宽高
    let imgWidth: number, imgHeight: number;
    if (config.orientation === 'horizontal') {
      // 横版：宽 > 高
      imgWidth = Math.round(baseShortSide * ratio);
      imgHeight = baseShortSide;
    } else {
      // 竖版：高 > 宽
      imgWidth = baseShortSide;
      imgHeight = Math.round(baseShortSide * ratio);
    }
    
    // 1:1 特殊处理
    if (w === h) {
      imgWidth = baseShortSide;
      imgHeight = baseShortSide;
    }
    
    // 计算外框尺寸
    const padding = config.showBorder 
      ? { top: 20, sides: 20, bottom: 90 } 
      : { top: 0, sides: 0, bottom: 0 };
    
    let frameWidth = imgWidth + padding.sides * 2;
    let frameHeight = imgHeight + padding.top + padding.bottom;
    
    // 如果超过最大高度，按比例缩放
    if (frameHeight > maxHeight) {
      const scale = maxHeight / frameHeight;
      frameWidth = Math.round(frameWidth * scale);
      frameHeight = maxHeight;
      imgWidth = Math.round(imgWidth * scale);
      imgHeight = Math.round(imgHeight * scale);
    }
    
    // 计算缩放后的 padding
    const scaledPadding = config.showBorder ? Math.round(20 * (imgWidth / (config.orientation === 'horizontal' ? baseShortSide * ratio : baseShortSide))) : 0;
    
    return {
      image: { width: imgWidth, height: imgHeight },
      frame: { width: frameWidth, height: frameHeight },
      padding: {
        top: config.showBorder ? Math.max(16, scaledPadding) : 0,
        sides: config.showBorder ? Math.max(16, scaledPadding) : 0,
      },
    };
  };

  const sizes = calculateSizes();

  // 删除图片
  const handleDeleteImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageUrl(null);
  };

  // 点击图片区域触发生成
  const handleImageAreaClick = () => {
    if (imageUrl || isGeneratingImage) return;
    onGenerateImage?.();
  };

  return (
    <div
      ref={cardRef}
      className="relative"
      style={{
        width: sizes.frame.width,
        height: sizes.frame.height,
        backgroundColor: config.showBorder ? '#ffffff' : 'transparent',
        borderRadius: '0',
        boxShadow: config.showBorder ? '0 16px 32px rgba(0, 0, 0, 0.15)' : 'none',
      }}
    >
      {/* 图片区域 */}
      <div
        onClick={handleImageAreaClick}
        className={`absolute bg-gold-100/90 overflow-hidden flex items-center justify-center ${
          !imageUrl && !isGeneratingImage ? 'cursor-pointer hover:bg-gold-200/90 transition-colors' : ''
        }`}
        style={{
          top: sizes.padding.top,
          left: sizes.padding.sides,
          width: sizes.image.width,
          height: sizes.image.height,
          borderRadius: config.showBorder ? '6px' : '0',
        }}
      >
        {imageUrl ? (
          <img 
            src={`/api/ai/image-proxy?url=${encodeURIComponent(imageUrl)}`} 
            alt="贺卡图片" 
            className="w-full h-full object-cover" 
          />
        ) : isGeneratingImage || (wasGenerating && isComplete) ? (
          <div className="text-center p-3 flex flex-col items-center">
            <ProgressRing 
              isLoading={isGeneratingImage} 
              isComplete={isComplete} 
            />
            <p className="text-sm font-medium text-gold-600 mt-2">
              {isComplete ? '完成!' : '生成中...'}
            </p>
          </div>
        ) : (
          <div className="text-center text-gold-600 p-3">
            <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <p className="text-sm font-medium">幸运生成器</p>
            <p className="text-xs mt-1 opacity-70">点击生成专属图片</p>
          </div>
        )}
      </div>

      {/* 删除按钮 - 图片左上角 (data-exclude-export 用于截图时排除) */}
      {imageUrl && (
        <button
          onClick={handleDeleteImage}
          data-exclude-export="true"
          className="absolute w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors z-10"
          style={{
            top: Math.max(sizes.padding.top - 12, -12),
            left: Math.max(sizes.padding.sides - 12, -12),
          }}
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* 底部文字区域 */}
      {config.showBorder && (
        <div
          className="absolute left-4 right-4 bottom-3 flex flex-col"
        >
          {/* 祝福语 */}
          <div className="text-center mb-1">
            <p
              className="text-primary-700 leading-relaxed whitespace-pre-line"
              style={{
                fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
                fontSize: blessingText.length > 20 ? '12px' : '14px',
              }}
            >
              {blessingText || ''}
            </p>
          </div>

          {/* Logo、校名、分享码 - 靠近底部 */}
          <div className="relative flex items-end min-h-8">
            {/* Logo + 校名 - 一起受 showLogo 控制 */}
            {config.showLogo && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-[6px] font-bold">Logo</span>
                </div>
                <div className="bg-primary-100 px-2 py-0.5 rounded text-[10px] text-primary-700 font-medium">
                  {organizationName || ''}
                </div>
              </div>
            )}

            {/* 分享码 - 固定在右下角 */}
            {config.showQrCode && (
              <div className="absolute right-0 bottom-0 w-8 h-8 bg-white rounded p-0.5">
                <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm11-2h2v2h-2v-2zm-4 0h2v6h-2v-6zm6 0h2v2h-2v-2zm0 4h2v4h-6v-2h4v-2zm-4 2h2v2h-2v-2z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
