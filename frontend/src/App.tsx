import { useEffect } from 'react';
import { Header } from './components/Header';
import { OptionsPanel } from './components/OptionsPanel';
import { BlessingInput } from './components/BlessingInput';
import { PreviewArea } from './components/PreviewArea';
import { HistoryPanel } from './components/HistoryPanel';
import { useCardStore } from './store/cardStore';

function App() {
  const { setToken, setUser } = useCardStore();

  // 处理 OAuth2 回调
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      setToken(token);
      // 清除 URL 中的 token 参数
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // TODO: 获取用户信息
      // getCurrentUser().then(setUser).catch(console.error);
    }
  }, [setToken, setUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-gold-50/30 to-primary-100">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* 顶部历史记录 */}
        <div className="mb-6">
          <HistoryPanel />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧选项面板 */}
          <div className="lg:w-72 flex-shrink-0 space-y-4">
            <OptionsPanel />
            <BlessingInput />
          </div>

          {/* 预览区域 */}
          <div className="flex-1 flex justify-center">
            <PreviewArea />
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="mt-12 py-6 text-center text-gray-400 text-sm">
        <p>聪明的贺年卡片生成工具 · 让祝福更有温度</p>
      </footer>
    </div>
  );
}

export default App;
