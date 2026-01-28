import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './Hongbao.css';

export interface HongbaoProps {
  /** 红包大小 (宽度，高度自动按 1:1.4 比例) */
  size?: number;
  /** 是否打开 */
  isOpen?: boolean;
  /** 位置 (用于动画移动) */
  position?: { x: number; y: number } | 'center' | 'bottom';
  /** 是否固定定位 */
  fixed?: boolean;
  /** 内部卡片图片 */
  cardImage?: string;
  /** 是否显示卡片（弹出状态） */
  cardVisible?: boolean;
  /** 卡片弹出的位置偏移 (相对于红包顶部) */
  cardOffset?: number;
  /** 是否振动 */
  shaking?: boolean;
  /** 是否发光 */
  glowing?: boolean;
  /** 过渡时间 (ms) */
  transitionDuration?: number;
  /** z-index */
  zIndex?: number;
  /** 点击事件 */
  onClick?: () => void;
  /** 点击卡片事件 */
  onCardClick?: () => void;
  /** 卡片最大高度（用于动画过程中限制显示） */
  cardMaxHeight?: number;
  className?: string;
}

export interface HongbaoRef {
  /** 获取红包 DOM 元素 */
  getElement: () => HTMLDivElement | null;
  /** 获取当前尺寸 */
  getSize: () => { width: number; height: number };
}

export const Hongbao = forwardRef<HongbaoRef, HongbaoProps>(({
  size = 200,
  isOpen = false,
  position = 'center',
  fixed = false,
  cardImage,
  cardVisible = false,
  cardOffset = 0,
  shaking = false,
  glowing = false,
  transitionDuration = 300,
  zIndex = 1,
  onClick,
  onCardClick,
  cardMaxHeight,
  className = '',
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const width = size;
  const height = size * 1.4;
  const flapHeight = size * 0.5;

  useImperativeHandle(ref, () => ({
    getElement: () => containerRef.current,
    getSize: () => ({ width, height }),
  }));

  // 计算位置样式
  const getPositionStyle = (): React.CSSProperties => {
    if (!fixed) return {};
    
    if (position === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }
    if (position === 'bottom') {
      return {
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
      };
    }
    // 自定义坐标
    return {
      position: 'fixed',
      top: position.y,
      left: position.x,
      transform: 'translate(-50%, -50%)',
    };
  };

  const containerStyle: React.CSSProperties = {
    ...getPositionStyle(),
    width,
    height,
    zIndex,
    transition: `all ${transitionDuration}ms ease-out`,
    cursor: onClick ? 'pointer' : 'default',
  };

  const flapStyle: React.CSSProperties = {
    width,
    height: flapHeight,
    transition: `all ${transitionDuration}ms ease-out`,
    transform: isOpen ? 'rotateX(-160deg)' : 'rotateX(0)',
    zIndex: isOpen ? 1 : 10,
  };

  const cardStyle: React.CSSProperties = {
    transition: `all ${transitionDuration}ms ease-out`,
    opacity: cardVisible ? 1 : 0,
    transform: `translateX(-50%) translateY(${cardVisible ? cardOffset : 50}px)`,
    pointerEvents: cardVisible ? 'auto' : 'none',
  };

  return (
    <div
      ref={containerRef}
      className={`hongbao-container ${shaking ? 'hongbao-shaking' : ''} ${glowing ? 'hongbao-glowing' : ''} ${className}`}
      style={containerStyle}
      onClick={onClick}
    >
      {/* 卡片槽 - 封口关闭时在封口后面，打开后在封口前面但在红包主体后面 */}
      {cardImage && (
        <div 
          className="hongbao-card-slot" 
          style={{
            transform: `translateY(${cardVisible ? cardOffset : 0}px)`,
            transition: `transform ${transitionDuration}ms ease-out, z-index 0s, max-height ${transitionDuration}ms ease-out`,
            zIndex: isOpen ? 3 : 0,
            cursor: onCardClick ? 'pointer' : 'default',
            ...(cardMaxHeight !== undefined && { maxHeight: cardMaxHeight, overflow: 'hidden' }),
          }}
          onClick={(e) => {
            if (onCardClick) {
              e.stopPropagation();
              onCardClick();
            }
          }}
        >
          <img src={cardImage} alt="贺卡" />
          {/* 二维码占位 */}
          <div className="hongbao-qrcode-placeholder">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-5 0h2v3h-2v-3zm2 3h3v2h-3v-2zm0 4h5v2h-5v-2zm3-4h2v4h-2v-4z"/>
            </svg>
          </div>
        </div>
      )}

      {/* 红包主体 - 底部 */}
      <div className="hongbao-body">
        <div className="hongbao-inner-glow" />
        <div className="hongbao-center">
          <span style={{ fontSize: size * 0.16 }}>福</span>
        </div>
      </div>

      {/* 红包封口 - 顶部，遮住卡片 */}
      <div className="hongbao-flap" style={flapStyle}>
        <div className="hongbao-flap-seal" />
      </div>
    </div>
  );
});

Hongbao.displayName = 'Hongbao';
