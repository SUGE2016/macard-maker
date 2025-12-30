import { useState } from 'react';
import { useCardStore } from '../store/cardStore';
import { generateText } from '../services/api';

export function BlessingInput() {
  const {
    blessingText,
    setBlessingText,
    isGeneratingText,
    setIsGeneratingText,
  } = useCardStore();
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGeneratingText(true);
    setError(null);
    try {
      // 如果已有文字，作为润色的输入
      const prompt = blessingText.trim() || undefined;
      const response = await generateText(prompt);
      setBlessingText(response.text);
    } catch (err) {
      setError('生成失败，请重试');
      console.error('生成祝福语失败:', err);
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleClear = () => {
    setBlessingText('');
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-primary-100">
      {/* 标题和自动生成按钮 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">祝福语 / 寄语</h3>
        <button
          onClick={handleGenerate}
          disabled={isGeneratingText}
          className="w-7 h-7 flex items-center justify-center text-primary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
          title="自动生成"
        >
          {isGeneratingText ? (
            <span className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* 输入框容器 */}
      <div className="relative">
        <textarea
          value={blessingText}
          onChange={(e) => setBlessingText(e.target.value)}
          placeholder="输入祝福语..."
          className="w-full h-28 px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none text-gray-700 text-sm leading-relaxed"
        />
        
        {/* 清空按钮 */}
        {blessingText && (
          <button
            onClick={handleClear}
            className="absolute bottom-3 right-3 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="清空"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-xs mt-2">{error}</p>
      )}
    </div>
  );
}
