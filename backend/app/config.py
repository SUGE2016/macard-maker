import os
from dotenv import load_dotenv

load_dotenv()

# 图片生成后端切换：ecnu / jimeng
AI_IMAGE_PROVIDER = os.getenv("AI_IMAGE_PROVIDER", "jimeng")

# ECNU 接口配置（OpenAI 兼容）
AI_IMAGE_API_URL = os.getenv("AI_IMAGE_API_URL", "")
AI_IMAGE_API_KEY = os.getenv("AI_IMAGE_API_KEY", "")
AI_IMAGE_MODEL = os.getenv("AI_IMAGE_MODEL", "ecnu-image")
AI_IMAGE_SIZE = os.getenv("AI_IMAGE_SIZE", "720x1280")

# 即梦接口配置（火山引擎 AK/SK 鉴权）
VOLC_ACCESS_KEY = os.getenv("VOLC_ACCESS_KEY", "")
VOLC_SECRET_KEY = os.getenv("VOLC_SECRET_KEY", "")
AI_IMAGE_WIDTH = int(os.getenv("AI_IMAGE_WIDTH", "1056"))
AI_IMAGE_HEIGHT = int(os.getenv("AI_IMAGE_HEIGHT", "1584"))

# AI 提示词配置
IMAGE_PROMPT = os.getenv(
    "IMAGE_PROMPT",
    "Chinese New Year greeting card background, traditional Chinese style, golden clouds, red lanterns, festive atmosphere, elegant and auspicious, high quality"
)

# OAuth2 SSO 配置
OAUTH2_CLIENT_ID = os.getenv("OAUTH2_CLIENT_ID", "")
OAUTH2_CLIENT_SECRET = os.getenv("OAUTH2_CLIENT_SECRET", "")
OAUTH2_AUTHORIZATION_URL = os.getenv("OAUTH2_AUTHORIZATION_URL", "")
OAUTH2_TOKEN_URL = os.getenv("OAUTH2_TOKEN_URL", "")
OAUTH2_USERINFO_URL = os.getenv("OAUTH2_USERINFO_URL", "")
OAUTH2_REDIRECT_URI = os.getenv("OAUTH2_REDIRECT_URI", "http://localhost:5173/auth/callback")

# 应用配置
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data.db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

