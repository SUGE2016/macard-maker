import { useEffect, useState } from 'react';

interface ProgressRingProps {
  isLoading: boolean;
  isComplete: boolean;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({ 
  isLoading, 
  isComplete, 
  size = 60, 
  strokeWidth = 4 
}: ProgressRingProps) {
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  useEffect(() => {
    if (isLoading && !startTime) {
      setStartTime(Date.now());
      setProgress(0);
    }
    
    if (!isLoading) {
      setStartTime(null);
    }
  }, [isLoading, startTime]);
  
  useEffect(() => {
    if (isComplete) {
      // 完成时快速到 100%
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return Math.min(100, prev + 5);
        });
      }, 30);
      return () => clearInterval(timer);
    }
  }, [isComplete]);
  
  useEffect(() => {
    if (!isLoading || !startTime || isComplete) return;
    
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000; // 秒
      
      let newProgress: number;
      if (elapsed <= 80) {
        // 0-80秒：线性增长到 89%
        newProgress = (elapsed / 80) * 89;
      } else {
        // 80-90秒：越来越慢，从 89% 到 99%
        const slowPhaseTime = elapsed - 80;
        // 使用对数函数让速度越来越慢
        newProgress = 89 + Math.log10(slowPhaseTime + 1) * 10;
        newProgress = Math.min(99, newProgress);
      }
      
      setProgress(newProgress);
    }, 100);
    
    return () => clearInterval(timer);
  }, [isLoading, startTime, isComplete]);
  
  if (!isLoading && progress === 0) return null;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* 背景环 */}
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gold-200"
        />
        {/* 进度环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-gold-500 transition-all duration-100"
        />
      </svg>
      {/* 百分比文字 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-medium text-gold-600">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

