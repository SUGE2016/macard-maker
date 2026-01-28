import os
from dotenv import load_dotenv

load_dotenv()

# AI 服务配置
AI_TEXT_API_URL = os.getenv("AI_TEXT_API_URL", "http://localhost:8000/v1")
AI_TEXT_API_KEY = os.getenv("AI_TEXT_API_KEY", "")
AI_IMAGE_API_URL = os.getenv("AI_IMAGE_API_URL", "")
AI_IMAGE_API_KEY = os.getenv("AI_IMAGE_API_KEY", "")
AI_IMAGE_MODEL = os.getenv("AI_IMAGE_MODEL", "ecnu-image")
AI_IMAGE_SIZE = os.getenv("AI_IMAGE_SIZE", "720x1280")  # 支持的尺寸由接口决定
AI_IMAGE_WIDTH = int(os.getenv("AI_IMAGE_WIDTH", "720"))
AI_IMAGE_HEIGHT = int(os.getenv("AI_IMAGE_HEIGHT", "1280"))

# AI 提示词配置
AI_TEXT_MODEL = os.getenv("AI_TEXT_MODEL", "gpt-3.5-turbo")
IMAGE_PROMPT = os.getenv(
    "IMAGE_PROMPT",
    "Chinese New Year greeting card background, traditional Chinese style, golden clouds, red lanterns, festive atmosphere, elegant and auspicious, high quality"
)
BLESSING_SYSTEM_PROMPT = os.getenv(
    "BLESSING_SYSTEM_PROMPT",
    """你是一个祝福语生成专家。请生成一条简短、优美的新年祝福语。
要求：
1. 语言优美、富有诗意
2. 简短精炼，不超过30个字
3. 适合用于贺卡
4. 体现美好祝愿

只输出祝福语内容，不要有其他说明。"""
)

# 阿里云 OSS 配置
OSS_ACCESS_KEY_ID = os.getenv("OSS_ACCESS_KEY_ID", "")
OSS_ACCESS_KEY_SECRET = os.getenv("OSS_ACCESS_KEY_SECRET", "")
OSS_ENDPOINT = os.getenv("OSS_ENDPOINT", "oss-cn-shanghai.aliyuncs.com")
OSS_BUCKET_NAME = os.getenv("OSS_BUCKET_NAME", "ecnunic-data-public")
OSS_PREFIX = os.getenv("OSS_PREFIX", "macard-test")  # 目录前缀，不影响其他应用

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

