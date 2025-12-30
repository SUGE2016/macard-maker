import { useCardStore } from '../store/cardStore';
import { login, logout } from '../services/api';

export function Header() {
  const { user, token, setToken, setUser } = useCardStore();

  const handleLogin = () => {
    login();
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    logout();
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-primary-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-gold-500 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">贺</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">新年小卡片</h1>
            <p className="text-xs text-gray-500">聪明的贺年卡片生成工具</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {token ? (
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-sm font-medium">
                    {user?.username?.[0] || 'U'}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-700">{user?.username || '用户'}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-primary-500 transition-colors"
              >
                退出
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              登录
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

