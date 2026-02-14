import { useState, useCallback, useEffect, useRef } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { Hongbao } from '../components/Hongbao';
import confetti from 'canvas-confetti';
import QRCodeStyling from 'qr-code-styling';
import './BlindboxPage.css';

// 二维码 URL
const QR_CODE_URL = import.meta.env.VITE_QR_CODE_URL || 'https://macard.ecnu.edu.cn';

type Step = 
  | 'home'
  | 'growing'      // 红包变大 + 粒子汇聚
  | 'shaking'      // 振动蓄力
  | 'maxSize'      // 突变最大
  | 'flapOpen'     // 封口打开
  | 'cardPeek'     // 卡片探出
  | 'cardOut'      // 卡片弹出 + 彩带
  | 'result';      // 完成

// 首页粒子配置
const homeParticlesOptions = {
  fullScreen: { enable: false },
  particles: {
    number: { value: 40 },
    color: { value: ['#f4d03f', '#ffeaa7', '#fff', '#fdcb6e'] },
    shape: { type: 'circle' as const },
    opacity: { value: { min: 0.2, max: 0.7 } },
    size: { value: { min: 1, max: 4 } },
    move: {
      enable: true,
      speed: 0.4,
      direction: 'none' as const,
      outModes: { default: 'out' as const },
      random: true,
      straight: false,
    },
    twinkle: { particles: { enable: true, frequency: 0.05, opacity: 1 } }
  },
  detectRetina: true
};

// 预加载图片并返回尺寸
function preloadImage(url: string): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = url;
  });
}

// API 调用
async function generateCardImage(): Promise<{ url: string; width: number; height: number }> {
  const response = await fetch('/api/ai/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: '' })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '网络错误' }));
    throw new Error(error.detail || '生成图片失败');
  }
  
  const data = await response.json();
  // 通过代理加载外部图片，避免跨域问题
  const proxyUrl = `/api/ai/image-proxy?url=${encodeURIComponent(data.image_url)}`;
  // 预加载图片，等下载完成后返回尺寸
  return preloadImage(proxyUrl);
}

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
  const [error, setError] = useState<string | null>(null);
  const [cardFullyOut, setCardFullyOut] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);  // 全屏预览图片
  const [bottomBgNum, setBottomBgNum] = useState(1);  // 底部装饰图编号
  const [normalHongbaoY, setNormalHongbaoY] = useState(0);  // 保存正常状态的红包位置
  const [fullOutHongbaoY, setFullOutHongbaoY] = useState(0);  // 保存完全弹出时的红包位置
  const [normalCardOffset, setNormalCardOffset] = useState(0);  // 保存正常状态的卡片偏移
  
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesAnimRef = useRef<number | null>(null);
  const particlesDataRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number;
    size: number; color: string; life: number; maxLife: number;
  }>>([]);
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

  // Canvas 汇聚粒子效果
  const startConvergeParticles = useCallback(() => {
    const canvas = particlesCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置 canvas 尺寸（考虑设备像素比）
    const dpr = Math.min(window.devicePixelRatio || 1, 2);  // 限制最大 2x
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const colors = ['#f4d03f', '#ffeaa7', '#fdcb6e', '#ffffff', '#f39c12'];
    
    // 清空粒子数组
    particlesDataRef.current = [];
    
    let spawnRate = 60;
    let batchSize = 18;
    let lastSpawn = 0;
    
    const addParticles = (count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 160 + Math.random() * 80;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        const speed = 0.02 + Math.random() * 0.01;
        
        particlesDataRef.current.push({
          x, y,
          vx: (centerX - x) * speed,
          vy: (centerY - y) * speed,
          size: 1.5 + Math.random() * 2,  // 1.5-3.5px
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 0,
          maxLife: 60 + Math.random() * 30  // 帧数
        });
      }
    };
    
    const animate = (timestamp: number) => {
      if (!particlesAnimRef.current) return;
      
      // 生成新粒子
      if (timestamp - lastSpawn > spawnRate) {
        addParticles(batchSize);
        lastSpawn = timestamp;
        if (spawnRate > 30) spawnRate *= 0.88;
        if (batchSize < 30) batchSize += 0.5;
      }
      
      // 清空画布
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      // 更新和绘制粒子
      const particles = particlesDataRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        
        const lifeRatio = p.life / p.maxLife;
        const fadeInEnd = 0.15;   // 15% 时间用于浮现
        const fadeOutStart = 0.85; // 85% 开始淡出
        
        // 移动逻辑：浮现期不动，之后加速汇聚
        if (lifeRatio > fadeInEnd) {
          // 汇聚阶段：easeIn 加速效果
          const moveProgress = (lifeRatio - fadeInEnd) / (1 - fadeInEnd);
          const accel = 1 + moveProgress * moveProgress * 3;  // 越来越快
          p.x += p.vx * accel;
          p.y += p.vy * accel;
        }
        
        // 移除到达中心或超时的粒子
        const distToCenter = Math.hypot(p.x - centerX, p.y - centerY);
        if (p.life > p.maxLife || distToCenter < 8) {
          particles.splice(i, 1);
          continue;
        }
        
        // 透明度：快速淡入，中间保持，最后淡出
        let alpha = 1;
        if (lifeRatio < fadeInEnd) {
          alpha = lifeRatio / fadeInEnd;  // 淡入
        } else if (lifeRatio > fadeOutStart) {
          alpha = 1 - (lifeRatio - fadeOutStart) / (1 - fadeOutStart);  // 淡出
        }
        
        // 粒子越接近中心越小
        const progress = 1 - distToCenter / 240;
        const currentSize = p.size * (1 - progress * 0.6);
        const drawSize = Math.max(currentSize, 0.5);
        
        // 绘制发光效果（半透明光晕）
        ctx.beginPath();
        ctx.arc(p.x, p.y, drawSize * 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.3;
        ctx.fill();
        
        // 绘制粒子核心（实心亮点）
        ctx.beginPath();
        ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
        ctx.globalAlpha = alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      
      particlesAnimRef.current = requestAnimationFrame(animate);
    };
    
    particlesAnimRef.current = requestAnimationFrame(animate);
  }, []);

  const stopConvergeParticles = useCallback(() => {
    if (particlesAnimRef.current) {
      cancelAnimationFrame(particlesAnimRef.current);
      particlesAnimRef.current = null;
    }
    particlesDataRef.current = [];
    const canvas = particlesCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
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

  // 缓慢变大动画（减速曲线，可取消），用于等待 API 期间
  const slowGrowRef = useRef<{ cancel: () => void } | null>(null);
  const currentSizeRef = useRef(200);
  
  const startSlowGrow = useCallback((from: number, to: number, duration: number) => {
    return new Promise<number>(resolve => {
      const startTime = performance.now();
      let cancelled = false;
      
      const animate = (now: number) => {
        if (cancelled) {
          resolve(currentSizeRef.current);
          return;
        }
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutQuad: 减速曲线，速度越来越慢
        const eased = 1 - (1 - progress) * (1 - progress);
        const currentSize = from + (to - from) * eased;
        currentSizeRef.current = currentSize;
        setSize(currentSize);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve(currentSize);
        }
      };
      
      slowGrowRef.current = {
        cancel: () => {
          cancelled = true;
        }
      };
      
      requestAnimationFrame(animate);
    });
  }, []);

  // 开始流程
  const handleStart = useCallback(async () => {
    // 确保从初始状态开始
    setSize(200);
    currentSizeRef.current = 200;
    setShaking(false);
    setError(null);
    
    // 等一帧确保渲染
    await new Promise(r => requestAnimationFrame(() => r(undefined)));
    
    // Step 1: 红包开始变大 + 粒子汇聚 + 同时调用 API
    setStep('growing');
    setGlowing(true);
    
    // 延迟启动粒子，确保 DOM 已渲染
    setTimeout(() => startConvergeParticles(), 50);
    
    // 同时开始调用 API 和动画
    let apiResolved = false;
    const apiPromise = generateCardImage()
      .then(result => {
        setCardImage(result.url);
        // 随机底部装饰图
        setBottomBgNum(Math.floor(Math.random() * 14) + 1);
        apiResolved = true;
        // API 返回后取消缓慢变大动画
        slowGrowRef.current?.cancel();
        return result;
      })
      .catch(err => {
        console.error('生成图片失败:', err);
        apiResolved = true;
        slowGrowRef.current?.cancel();
        // 失败时使用占位图
        const fallbackUrl = `https://placehold.co/720x1280/e74c3c/ffffff?text=Lucky You!`;
        setCardImage(fallbackUrl);
        setError(err.message || '生成图片失败，使用默认图片');
        return { url: fallbackUrl, width: 720, height: 1280 };
      });
    
    // Step 1: 平滑加速变大：200 -> 280，在280时开始振动
    await animateSize(200, 280, 800, 280);
    currentSizeRef.current = 280;
    setShaking(true);

    // Step 2: 如果 API 还没返回，继续缓慢变大 280 -> 320（减速曲线）
    if (!apiResolved) {
      await startSlowGrow(280, 320, 3000);  // 3秒内缓慢变大到320
    }

    // 等待 API 返回（如果还没完成）
    const imageResult = await apiPromise;

    // Step 3: API 返回后，固定 200ms 变大到最大
    setStep('maxSize');
    await animateSize(currentSizeRef.current, 400, 200);
    
    // 根据图片尺寸动态计算位置
    const hongbaoWidth = 400;
    const hongbaoHeight = hongbaoWidth * 1.4;  // 560px
    const cardWidth = hongbaoWidth * 0.9;  // 360px
    const cardHeight = cardWidth * (imageResult.height / imageResult.width);
    
    // 计算红包与卡片的重叠量
    const screenHeight = window.innerHeight;
    const buttonsArea = 70;  // 底部按钮区域 (bottom:30 + 按钮高度:40)
    const minOverlap = 20;   // 默认最小重叠
    
    // 只关心卡片+按钮是否能放下（红包大部分在屏幕外是正常的）
    const neededHeight = cardHeight + buttonsArea;
    // 只有屏幕特别矮时才增加 overlap
    const extraOverlap = Math.max(0, neededHeight - screenHeight);
    
    const maxOverlap = 150;
    const overlap = Math.min(maxOverlap, minOverlap + extraOverlap);
    
    // 图片垂直居中，红包下移到只遮挡图片底部一点点
    const finalCardOffset = -cardHeight + overlap - hongbaoHeight * 0.1;
    const normalY = cardHeight / 2 - overlap + hongbaoHeight / 2;
    // 完全弹出：红包完全不遮挡图片（红包顶部在图片底部下方）
    const fullOutY = cardHeight / 2 + hongbaoHeight / 2 + 20;  // 额外 20px 间距
    
    // 保存位置值供切换使用
    setNormalHongbaoY(normalY);
    setFullOutHongbaoY(fullOutY);
    setNormalCardOffset(finalCardOffset);
    setCardFullyOut(false);

    // Step 4: 封口打开（停止振动和粒子）
    setStep('flapOpen');
    setShaking(false);
    stopConvergeParticles();
    setIsOpen(true);
    
    await new Promise(r => setTimeout(r, 100));

    // Step 5: 卡片探出（用 cardMaxHeight 限制显示范围）
    setStep('cardPeek');
    setCardVisible(true);
    setCardOffset(-80);
    
    await new Promise(r => setTimeout(r, 80));

    // Step 6: 卡片爆发弹出 + 红包下移 + 礼花（同时进行）
    setStep('result');
    fireConfettiEffect();
    setCardOffset(finalCardOffset);
    setHongbaoY(normalY);
    setGlowing(false);
  }, [startConvergeParticles, stopConvergeParticles, fireConfettiEffect, animateSize, startSlowGrow]);

  // 切换卡片完全弹出/正常状态
  const toggleCardFullyOut = useCallback(() => {
    if (step !== 'result') return;
    setCardFullyOut(prev => {
      const newState = !prev;
      // 红包下移时，图片需要往上移动相同距离来保持垂直居中
      const hongbaoMoveDelta = fullOutHongbaoY - normalHongbaoY;
      setHongbaoY(newState ? fullOutHongbaoY : normalHongbaoY);
      setCardOffset(newState ? normalCardOffset - hongbaoMoveDelta : normalCardOffset);
      return newState;
    });
  }, [step, fullOutHongbaoY, normalHongbaoY, normalCardOffset]);

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
    setError(null);
    setCardFullyOut(false);
    
    // 等待状态更新完成
    await new Promise(r => setTimeout(r, 50));
    
    // 开始新的动画
    handleStart();
  }, [stopConvergeParticles, handleStart]);

  // 保存图片 - 用 canvas 合成完整图片
  const handleSave = useCallback(async () => {
    if (!cardImage) return;
    
    try {
      // 加载原图
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = cardImage;
      });
      
      // 加载页脚图片
      const footerImg = new Image();
      await new Promise((resolve, reject) => {
        footerImg.onload = resolve;
        footerImg.onerror = reject;
        footerImg.src = '/backgrounds/ecnu-name.png';
      });
      
      // 加载底部装饰图
      const bottomDecorImg = new Image();
      await new Promise((resolve, reject) => {
        bottomDecorImg.onload = resolve;
        bottomDecorImg.onerror = reject;
        bottomDecorImg.src = `/backgrounds/${bottomBgNum}.png`;
      });
      
      // 按比例计算尺寸（基于 360px 宽度下的尺寸）
      const scale = img.width / 360;
      const footerHeight = Math.round(40 * scale);
      // 二维码显示尺寸（32px）与边距（4px），与 CSS 一致
      const qrDisplaySize = Math.round(32 * scale);
      const qrMargin = Math.round(4 * scale);
      const padding = Math.round(12 * scale);
      
      const canvasWidth = img.width;
      const canvasHeight = img.height;  // 不延长，叠加在图片上
      
      // 创建 canvas
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d')!;
      
      // 绘制原图
      ctx.drawImage(img, 0, 0);
      
      // 绘制底部装饰图（在页脚下层，带阴影，与 CSS 保持一致）
      const maxDecorWidth = canvasWidth * 0.5;  // max-width: 50%
      const maxDecorHeight = canvasHeight * 0.25;  // max-height: 25%
      const decorLeft = Math.round(15 * scale);  // left: 15px
      const decorBottom = Math.round(39 * scale);  // bottom: 39px
      
      // 计算实际尺寸（保持宽高比，不超过最大限制）
      const imgRatio = bottomDecorImg.width / bottomDecorImg.height;
      let finalDecorWidth = maxDecorWidth;
      let finalDecorHeight = finalDecorWidth / imgRatio;
      if (finalDecorHeight > maxDecorHeight) {
        finalDecorHeight = maxDecorHeight;
        finalDecorWidth = finalDecorHeight * imgRatio;
      }
      
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 8 * scale;
      ctx.shadowOffsetY = -4 * scale;
      ctx.drawImage(bottomDecorImg, decorLeft, canvasHeight - finalDecorHeight - decorBottom, finalDecorWidth, finalDecorHeight);
      ctx.restore();
      
      // 绘制页脚背景（深红半透明，叠加在图片底部）
      const footerY = canvasHeight - footerHeight;
      const gradient = ctx.createLinearGradient(0, footerY, 0, canvasHeight);
      gradient.addColorStop(0, 'rgba(139, 26, 26, 0.85)');
      gradient.addColorStop(1, 'rgba(107, 21, 21, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, footerY, canvasWidth, footerHeight);
      
      // 二维码位置（页脚右侧，上下左右等距 4px）
      const qrX = canvasWidth - qrDisplaySize - qrMargin;
      const qrY = footerY + (footerHeight - qrDisplaySize) / 2;
      
      // 绘制页脚文字图片（居左）
      const footerImgHeight = Math.round(24 * scale);
      const footerImgWidth = footerImg.width * (footerImgHeight / footerImg.height);
      const footerImgY = footerY + (footerHeight - footerImgHeight) / 2;
      ctx.drawImage(footerImg, padding, footerImgY, footerImgWidth, footerImgHeight);
      
      // 绘制二维码提示文字（紧贴二维码左侧，右对齐）
      const hintFontSize = Math.round(10 * scale);
      ctx.font = `${hintFontSize}px sans-serif`;
      ctx.fillStyle = '#f4d03f';
      ctx.textAlign = 'right';
      const hintLine1 = '识别二维码';
      const hintLine2 = '生成自己的春节贺卡';
      const hintLineHeight = hintFontSize * 1.3;
      const hintX = qrX - Math.round(4 * scale);
      const hintCenterY = footerY + footerHeight / 2;
      ctx.textBaseline = 'middle';
      ctx.fillText(hintLine1, hintX, hintCenterY - hintLineHeight / 2);
      ctx.fillText(hintLine2, hintX, hintCenterY + hintLineHeight / 2);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      
      // 生成圆点风格二维码
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      
      const qrCode = new QRCodeStyling({
        width: 200,
        height: 200,
        data: QR_CODE_URL,
        type: 'canvas',
        dotsOptions: {
          color: '#f4d03f',
          type: 'dots',
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
      
      qrCode.append(tempDiv);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 获取二维码 canvas
      const qrCanvas = tempDiv.querySelector('canvas');
      if (qrCanvas) {
        ctx.drawImage(qrCanvas, qrX, qrY, qrDisplaySize, qrDisplaySize);
      }
      tempDiv.remove();
      
      // 绘制 "AI生成" 胶囊标签（图片左上角）
      const fontSize = Math.round(10 * scale);
      const labelPaddingH = Math.round(8 * scale);
      const labelPaddingV = Math.round(3 * scale);
      const labelText = 'AI生成';
      ctx.font = `${fontSize}px sans-serif`;
      const textWidth = ctx.measureText(labelText).width;
      const labelWidth = textWidth + labelPaddingH * 2;
      const labelHeight = fontSize + labelPaddingV * 2;
      const labelX = Math.round(8 * scale);
      const labelY = Math.round(8 * scale);
      const labelRadius = Math.round(10 * scale);
      
      // 绘制胶囊背景（与 CSS rgba(255,255,255,0.30) 一致）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
      ctx.beginPath();
      ctx.roundRect(labelX, labelY, labelWidth, labelHeight, labelRadius);
      ctx.fill();
      
      // 绘制文字
      ctx.fillStyle = 'rgba(180, 60, 60, 0.6)';
      ctx.textAlign = 'left';
      ctx.fillText(labelText, labelX + labelPaddingH, labelY + labelPaddingV + fontSize * 0.85);
      
      // 转为图片并显示预览
      const dataUrl = canvas.toDataURL('image/png', 1);
      setPreviewImage(dataUrl);
    } catch (err) {
      console.error('合成图片失败:', err);
      alert('合成图片失败，请重试');
    }
  }, [cardImage, bottomBgNum]);

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
      </div>

      {/* 首页 */}
      {step === 'home' && (
        <div className="page page-home">
          <img src="/backgrounds/title.png" alt="贺年卡" className="title" />
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
          <div className="btn-wrapper">
            <span className="btn-hint">点击汇聚新年祝福</span>
            <button className="btn-primary" onClick={handleStart}>
              祝全球校友新春快乐
            </button>
          </div>
          <span className="home-copyright">©信息化治理办公室</span>
        </div>
      )}

      {/* 动画进行中 */}
      {isAnimating && (
        <div className="page page-loading">
          {/* Canvas 粒子容器 - 在红包上层 */}
          <canvas ref={particlesCanvasRef} className="particles-canvas" />
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
              bottomBgNum={bottomBgNum}
              cardVisible={cardVisible}
              cardOffset={cardOffset}
              transitionDuration={400}
              onCardClick={step === 'result' ? toggleCardFullyOut : undefined}
              cardMaxHeight={step === 'result' ? undefined : size * 1.4 * 0.9 - cardOffset}
            />
          </div>
          {/* 结果页按钮 */}
          {step === 'result' && !cardFullyOut && (
            <div className="result-buttons">
              <button className="btn-primary" onClick={handleSave}>分享贺年卡</button>
              <button className="btn-secondary" onClick={handleReset}>新的惊喜</button>
            </div>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="error-toast" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {/* 全屏预览 - 方便长按保存 */}
      {previewImage && (
        <div className="preview-overlay" onClick={() => setPreviewImage(null)}>
          <div className="preview-content" onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="贺年卡" />
            <p className="preview-tip">长按图片保存到相册</p>
            <button className="preview-close" onClick={() => setPreviewImage(null)}>关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}

