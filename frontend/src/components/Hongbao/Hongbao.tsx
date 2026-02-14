import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import QRCodeStyling from 'qr-code-styling';
import './Hongbao.css';

// 二维码 URL，可通过环境变量配置
const QR_CODE_URL = import.meta.env.VITE_QR_CODE_URL || 'https://macard.ecnu.edu.cn';

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
  /** 底部装饰图编号 (1-14) */
  bottomBgNum?: number;
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
  bottomBgNum = 1,
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
  const qrRef = useRef<HTMLDivElement>(null);
  
  const width = size;
  const height = size * 1.4;
  const flapHeight = size * 0.5;

  // 初始化圆点风格二维码
  useEffect(() => {
    if (!qrRef.current || !cardImage) return;
    
    // 清空之前的内容
    qrRef.current.innerHTML = '';
    
    const qrCode = new QRCodeStyling({
      width: 200,
      height: 200,
      data: QR_CODE_URL,
      dotsOptions: {
        color: '#f4d03f',
        type: 'dots',  // 圆点风格
      },
      backgroundOptions: {
        color: 'transparent',
      },
      cornersSquareOptions: {
        type: 'dot',
      },
      cornersDotOptions: {
        type: 'dot',
      },
    });
    qrCode.append(qrRef.current);
  }, [cardImage]);

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
          <img 
            src={cardImage} 
            alt="贺卡" 
            onContextMenu={e => e.preventDefault()}
            draggable={false}
          />
          {/* AI生成标签 - 左上角 */}
          <span className="ai-label">AI生成</span>
          {/* 底部装饰图 - 在页脚下层 */}
          <img 
            src={`/backgrounds/${bottomBgNum}.png`} 
            alt="" 
            className="card-bottom-decoration" 
          />
          {/* 版权信息 - 页脚右上方 */}
          <span className="card-copyright">©信息化治理办公室</span>
          {/* 页脚 - 烫金名称 + 二维码 */}
          <div className="hongbao-card-footer">
            <img src="/backgrounds/ecnu-name.png" alt="华东师范大学" className="footer-name" />
            <span className="footer-qr-hint">识别二维码<br/>生成自己的春节贺卡</span>
            <div className="footer-qrcode">
              <div ref={qrRef} className="qrcode-dots" />
            </div>
          </div>
        </div>
      )}

      {/* 红包主体 - 底部 */}
      <div className="hongbao-body">
        <div className="hongbao-inner-glow" />
        <div className="hongbao-center">
          <span style={{ fontSize: size * 0.16 }}>福</span>
        </div>
        <span className="hongbao-brand" style={{ fontSize: size * 0.06 }}>ChatECNU</span>
      </div>

      {/* 红包封口 - 顶部，遮住卡片 */}
      <div className="hongbao-flap" style={flapStyle}>
        <div className="hongbao-flap-seal" />
      </div>
    </div>
  );
});

Hongbao.displayName = 'Hongbao';
