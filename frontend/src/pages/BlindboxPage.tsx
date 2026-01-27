import { useState, useCallback, useEffect, useRef } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { Hongbao } from '../components/Hongbao';
import confetti from 'canvas-confetti';
import './BlindboxPage.css';

type Step = 
  | 'home'
  | 'growing'      // 红包变大 + 粒子汇聚
  | 'shaking'      // 振动蓄力
  | 'maxSize'      // 突变最大
  | 'flapOpen'     // 封口打开
  | 'cardPeek'     // 卡片探出
  | 'cardOut'      // 卡片弹出 + 彩带
  | 'result';      // 完成

// 首页少量粒子配置
const homeParticlesOptions = {
  fullScreen: { enable: false },
  particles: {
    number: { value: 15 },
    color: { value: ['#f4d03f', '#ffeaa7', '#fff'] },
    shape: { type: 'circle' as const },
    opacity: { value: { min: 0.2, max: 0.6 } },
    size: { value: { min: 1, max: 3 } },
    move: {
      enable: true,
      speed: 0.5,
      direction: 'top' as const,
      outModes: { default: 'out' as const },
      random: true
    },
    twinkle: { particles: { enable: true, frequency: 0.03, opacity: 1 } }
  },
  detectRetina: true
};

// 背景烟花配置
const fireworksOptions = {
  fullScreen: { enable: false },
  detectRetina: true,
  particles: {
    number: { value: 20 },
    color: { value: ['#f4d03f', '#ffeaa7', '#fff'] },
    shape: { type: 'circle' as const },
    opacity: { value: { min: 0.3, max: 0.8 } },
    size: { value: { min: 1, max: 3 } },
    move: {
      enable: true,
      speed: 1,
      direction: 'top' as const,
      outModes: { default: 'out' as const },
      random: true
    },
    twinkle: { particles: { enable: true, frequency: 0.05, opacity: 1 } }
  }
};

export function BlindboxPage() {
  const [step, setStep] = useState<Step>('home');
  const [size, setSize] = useState(200);
  const [isOpen, setIsOpen] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [cardOffset, setCardOffset] = useState(0);
  const [cardImage, setCardImage] = useState('');
  const [hongbaoY, setHongbaoY] = useState(0);
  const [particlesReady, setParticlesReady] = useState(false);
  
  const particlesRef = useRef<HTMLDivElement>(null);
  const particleIntervalsRef = useRef<number[]>([]);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const confettiInstanceRef = useRef<ReturnType<typeof confetti.create> | null>(null);

  // 初始化粒子引擎
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setParticlesReady(true));
  }, []);

  // 初始化 confetti canvas
  useEffect(() => {
    if (confettiCanvasRef.current && !confettiInstanceRef.current) {
      confettiInstanceRef.current = confetti.create(confettiCanvasRef.current, {
        resize: true,
        useWorker: false
      });
    }
  }, []);

  // 彩带喷发
  const fireConfettiEffect = useCallback(() => {
    const myConfetti = confettiInstanceRef.current;
    if (!myConfetti) return;
    
    const colors = ['#f4d03f', '#e74c3c', '#ff6b6b', '#ffeaa7', '#fff', '#c0392b', '#fdcb6e'];
    
    myConfetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.4 },
      angle: 90,
      startVelocity: 60,
      gravity: 0.8,
      colors,
      shapes: ['square', 'circle'],
      scalar: 1.2
    });
    
    setTimeout(() => {
      myConfetti({
        particleCount: 50,
        spread: 60,
        origin: { x: 0.3, y: 0.5 },
        angle: 60,
        startVelocity: 50,
        colors,
        shapes: ['square', 'circle']
      });
    }, 100);
    
    setTimeout(() => {
      myConfetti({
        particleCount: 50,
        spread: 60,
        origin: { x: 0.7, y: 0.5 },
        angle: 120,
        startVelocity: 50,
        colors,
        shapes: ['square', 'circle']
      });
    }, 100);
  }, []);

  // 汇聚粒子效果
  const startConvergeParticles = useCallback(() => {
    const container = particlesRef.current;
    if (!container) {
      return;
    }
    
    container.innerHTML = '';
    particleIntervalsRef.current.forEach(id => clearTimeout(id));
    particleIntervalsRef.current = [];
    
    const colors = ['#f4d03f', '#ffeaa7', '#fdcb6e', '#fff', '#f39c12'];
    let spawnRate = 80;
    let batchSize = 15;
    let minDuration = 1.5;
    
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'converge-particle';
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 160 + Math.random() * 80;
      const startX = Math.cos(angle) * distance;
      const startY = Math.sin(angle) * distance;
      const size = 2 + Math.random() * 4;
      const duration = minDuration + Math.random() * 0.8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particle.style.cssText = `
        left: calc(50% + ${startX}px);
        top: calc(50% + ${startY}px);
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        box-shadow: 0 0 ${size * 2}px ${color};
        --move-x: ${-startX}px;
        --move-y: ${-startY}px;
        animation: convergeToCenter ${duration}s ease-in forwards;
      `;
      
      container.appendChild(particle);
      setTimeout(() => particle.remove(), duration * 1000);
    };
    
    const accelerate = () => {
      for (let i = 0; i < batchSize; i++) createParticle();
      
      if (spawnRate > 30) spawnRate *= 0.85;
      if (batchSize < 30) batchSize += 0.6;
      if (minDuration > 0.4) minDuration *= 0.94;
      
      const id = window.setTimeout(accelerate, spawnRate);
      particleIntervalsRef.current.push(id);
    };
    
    accelerate();
  }, []);

  const stopConvergeParticles = useCallback(() => {
    particleIntervalsRef.current.forEach(id => clearTimeout(id));
    particleIntervalsRef.current = [];
    if (particlesRef.current) particlesRef.current.innerHTML = '';
  }, []);

  // 平滑变大动画（加速曲线）
  const animateSize = useCallback((from: number, to: number, duration: number, onShake?: number) => {
    return new Promise<void>(resolve => {
      const startTime = performance.now();
      let shakeTriggered = false;
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeInQuad: 加速曲线
        const eased = progress * progress;
        const currentSize = from + (to - from) * eased;
        setSize(currentSize);
        
        // 到达指定大小时开始振动（只触发一次）
        if (onShake && currentSize >= onShake && !shakeTriggered) {
          shakeTriggered = true;
          setShaking(true);
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }, []);

  // 开始流程
  const handleStart = useCallback(async () => {
    // 确保从初始状态开始
    setSize(200);
    setShaking(false);
    
    // 等一帧确保渲染
    await new Promise(r => requestAnimationFrame(() => r(undefined)));
    
    // Step 1: 红包开始变大 + 粒子汇聚
    setStep('growing');
    setGlowing(true);
    setCardImage(`https://picsum.photos/seed/${Date.now()}/512/680`);
    
    // 延迟启动粒子，确保 DOM 已渲染
    setTimeout(() => startConvergeParticles(), 50);
    
    // 平滑加速变大：200 -> 320，在280时开始振动
    await animateSize(200, 320, 1200, 280);

    // Step 2: 继续变大到最大
    setStep('maxSize');
    await animateSize(320, 400, 400);

    // Step 4: 封口打开（停止振动和粒子）
    setStep('flapOpen');
    setShaking(false);
    stopConvergeParticles();
    setIsOpen(true);
    
    await new Promise(r => setTimeout(r, 100));

    // Step 5: 卡片探出
    setStep('cardPeek');
    setCardVisible(true);
    setCardOffset(-80);
    
    await new Promise(r => setTimeout(r, 80));

    // Step 6: 卡片爆发弹出 + 红包下移 + 礼花（同时进行）
    setStep('result');
    fireConfettiEffect();
    setCardOffset(-450);
    setHongbaoY(490);
    setGlowing(false);
  }, [startConvergeParticles, stopConvergeParticles, fireConfettiEffect]);

  // 重新开始（新的惊喜）- 直接从粒子汇聚开始
  const handleReset = useCallback(async () => {
    // 先重置状态
    stopConvergeParticles();
    setIsOpen(false);
    setShaking(false);
    setGlowing(false);
    setCardVisible(false);
    setCardOffset(0);
    setHongbaoY(0);
    setCardImage('');
    setSize(200);
    
    // 等待状态更新完成
    await new Promise(r => setTimeout(r, 50));
    
    // 开始新的动画
    handleStart();
  }, [stopConvergeParticles, handleStart]);

  // 保存图片
  const handleSave = useCallback(() => {
    alert('请长按图片保存到相册');
  }, []);

  const isAnimating = step !== 'home';

  return (
    <div className="blindbox-page">
      {/* 礼花 canvas */}
      <canvas ref={confettiCanvasRef} className="confetti-canvas" />
      
      {/* 背景 */}
      <div className="blindbox-bg">
        <img className="cloud cloud-1" src="/backgrounds/cloud-small.png" alt="" />
        <img className="cloud cloud-2" src="/backgrounds/cloud-small.png" alt="" />
        <img className="cloud cloud-3" src="/backgrounds/cloud-small.png" alt="" />
        <img className="cloud cloud-4" src="/backgrounds/cloud-small.png" alt="" />
        {/* 背景烟花 */}
        {particlesReady && (
          <Particles
            id="fireworks"
            className="fireworks-bg"
            options={fireworksOptions}
          />
        )}
      </div>

      {/* 首页 */}
      {step === 'home' && (
        <div className="page page-home">
          <h1 className="title">贺年卡</h1>
          <div className="hongbao-wrapper" onClick={handleStart}>
            {/* 首页少量粒子效果 */}
            {particlesReady && (
              <Particles
                id="home-particles"
                className="home-particles"
                options={homeParticlesOptions}
              />
            )}
            <Hongbao size={200} />
          </div>
          <button className="btn-primary" onClick={handleStart}>
            装入新年祝福
          </button>
        </div>
      )}

      {/* 动画进行中 */}
      {isAnimating && (
        <div className="page page-loading">
          {/* 粒子容器 - 在红包上层 */}
          <div ref={particlesRef} className="particles-container" />
          <div 
            className="hongbao-animated"
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

      {/* 结果页按钮 */}
      {step === 'result' && (
        <div className="result-buttons">
          <button className="btn-primary" onClick={handleSave}>保存图片</button>
          <button className="btn-secondary" onClick={handleReset}>新的惊喜</button>
        </div>
      )}
    </div>
  );
}

