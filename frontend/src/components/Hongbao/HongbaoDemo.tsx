import { useState, useCallback, useRef } from 'react';
import { Hongbao } from './Hongbao';
import './HongbaoDemo.css';

type Step = 
  | 'idle'           // 首页待机
  | 'growing'        // 红包变大中
  | 'shaking'        // 振动蓄力
  | 'maxSize'        // 达到最大尺寸
  | 'flapOpen'       // 封口打开
  | 'cardPeek'       // 卡片探出
  | 'cardOut'        // 卡片完全弹出
  | 'hongbaoDown'    // 红包下移
  | 'done';          // 完成

const STEP_NAMES: Record<Step, string> = {
  idle: '首页待机',
  growing: '红包变大中',
  shaking: '振动蓄力',
  maxSize: '达到最大尺寸',
  flapOpen: '封口打开',
  cardPeek: '卡片探出',
  cardOut: '卡片完全弹出',
  hongbaoDown: '红包下移',
  done: '完成',
};

export function HongbaoDemo() {
  const [step, setStep] = useState<Step>('idle');
  const [size, setSize] = useState(200);
  const [isOpen, setIsOpen] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [cardOffset, setCardOffset] = useState(50);
  const [hongbaoY, setHongbaoY] = useState(0);
  const [cardImage] = useState('https://picsum.photos/seed/demo123/400/530');
  
  const resolveRef = useRef<(() => void) | null>(null);

  // 等待用户点击继续
  const waitForContinue = () => {
    return new Promise<void>(resolve => {
      resolveRef.current = resolve;
    });
  };

  // 点击继续按钮
  const handleContinue = () => {
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  };

  // 开始动画流程
  const handleStart = useCallback(async () => {
    // Step 1: 开始变大
    setStep('growing');
    setGlowing(true);
    
    // 渐变到 320
    for (let s = 200; s <= 320; s += 10) {
      setSize(s);
      await delay(50);
    }
    
    await waitForContinue();

    // Step 2: 振动蓄力
    setStep('shaking');
    setShaking(true);
    
    await waitForContinue();

    // Step 3: 突变到最大
    setStep('maxSize');
    setShaking(false);
    setSize(360);
    
    await waitForContinue();

    // Step 4: 封口打开
    setStep('flapOpen');
    setIsOpen(true);
    
    await waitForContinue();

    // Step 5: 卡片探出
    setStep('cardPeek');
    setCardVisible(true);
    setCardOffset(-80);
    
    await waitForContinue();

    // Step 6: 卡片完全弹出
    setStep('cardOut');
    setCardOffset(-300);
    
    await waitForContinue();

    // Step 7: 红包下移
    setStep('hongbaoDown');
    setHongbaoY(200);
    setGlowing(false);
    
    await waitForContinue();

    // Step 8: 完成
    setStep('done');
  }, []);

  // 重置
  const handleReset = useCallback(() => {
    setStep('idle');
    setSize(200);
    setIsOpen(false);
    setShaking(false);
    setGlowing(false);
    setCardVisible(false);
    setCardOffset(50);
    setHongbaoY(0);
    resolveRef.current = null;
  }, []);

  const showContinueBtn = step !== 'idle' && step !== 'done';

  return (
    <div className="hongbao-demo">
      <div className="demo-bg" />

      {/* 调试信息 */}
      <div className="demo-debug">
        <div className="debug-step">步骤: {STEP_NAMES[step]}</div>
        <div className="debug-props">
          size={size} | open={isOpen ? 'Y' : 'N'} | shake={shaking ? 'Y' : 'N'} | 
          glow={glowing ? 'Y' : 'N'} | cardVis={cardVisible ? 'Y' : 'N'} | 
          cardY={cardOffset} | hongbaoY={hongbaoY}
        </div>
      </div>

      {/* 首页 */}
      {step === 'idle' && (
        <div className="demo-page demo-home">
          <h1 className="demo-title">贺年卡</h1>
          <div className="demo-hongbao-wrapper">
            <Hongbao size={200} />
          </div>
          <button className="demo-btn-primary" onClick={handleStart}>
            开始动画
          </button>
        </div>
      )}

      {/* 动画进行中 */}
      {step !== 'idle' && step !== 'done' && (
        <div className="demo-page demo-animating">
          <div 
            className="demo-hongbao-animated"
            style={{ transform: `translateY(${hongbaoY}px)` }}
          >
            <Hongbao
              size={size}
              isOpen={isOpen}
              shaking={shaking}
              glowing={glowing}
              cardImage={cardImage}
              cardVisible={cardVisible}
              cardOffset={cardOffset}
              transitionDuration={400}
            />
          </div>
        </div>
      )}

      {/* 完成 */}
      {step === 'done' && (
        <div className="demo-page demo-result">
          <div className="demo-card-final">
            <img src={cardImage} alt="贺卡" />
          </div>
          <div className="demo-hongbao-final">
            <Hongbao size={360} isOpen={true} />
          </div>
          <button className="demo-btn-secondary" onClick={handleReset}>
            重新开始
          </button>
        </div>
      )}

      {/* 继续按钮 */}
      {showContinueBtn && (
        <button className="demo-continue-btn" onClick={handleContinue}>
          继续 →
        </button>
      )}

      {/* 重置按钮 */}
      {step !== 'idle' && (
        <button className="demo-reset-btn" onClick={handleReset}>
          重置
        </button>
      )}
    </div>
  );
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
