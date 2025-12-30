import oss2
import base64
import uuid
from datetime import datetime
from io import BytesIO
from PIL import Image

from app.config import OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_ENDPOINT, OSS_BUCKET_NAME, OSS_PREFIX

# 初始化 OSS 客户端
auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET_NAME) if OSS_BUCKET_NAME else None


def get_oss_url(key: str) -> str:
    """获取 OSS 文件的公网 URL"""
    return f"https://{OSS_BUCKET_NAME}.{OSS_ENDPOINT}/{key}"


async def upload_image(image_data: str, user_id: int) -> tuple[str, str]:
    """
    上传图片到 OSS
    
    Args:
        image_data: base64 编码的图片数据
        user_id: 用户 ID
        
    Returns:
        tuple: (原图 URL, 缩略图 URL)
    """
    if not bucket:
        raise Exception("OSS 未配置")
    
    # 解码 base64 图片
    if "," in image_data:
        image_data = image_data.split(",")[1]
    image_bytes = base64.b64decode(image_data)
    
    # 生成文件名（使用 OSS_PREFIX 目录前缀）
    timestamp = datetime.now().strftime("%Y%m%d")
    unique_id = uuid.uuid4().hex[:8]
    key = f"{OSS_PREFIX}/cards/{user_id}/{timestamp}/{unique_id}.png"
    thumbnail_key = f"{OSS_PREFIX}/cards/{user_id}/{timestamp}/{unique_id}_thumb.png"
    
    # 上传原图
    bucket.put_object(key, image_bytes, headers={"Content-Type": "image/png"})
    
    # 生成并上传缩略图
    image = Image.open(BytesIO(image_bytes))
    thumbnail_size = (200, 200)
    image.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)
    
    thumbnail_buffer = BytesIO()
    image.save(thumbnail_buffer, format="PNG")
    thumbnail_buffer.seek(0)
    
    bucket.put_object(thumbnail_key, thumbnail_buffer.getvalue(), headers={"Content-Type": "image/png"})
    
    return get_oss_url(key), get_oss_url(thumbnail_key)


async def delete_image(image_url: str) -> None:
    """从 OSS 删除图片"""
    if not bucket:
        return
    
    # 从 URL 提取 key
    prefix = f"https://{OSS_BUCKET_NAME}.{OSS_ENDPOINT}/"
    if image_url.startswith(prefix):
        key = image_url[len(prefix):]
        bucket.delete_object(key)


def get_image_url(key: str) -> str:
    """获取图片 URL"""
    return get_oss_url(key)

