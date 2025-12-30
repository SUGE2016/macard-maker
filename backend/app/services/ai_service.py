from openai import AsyncOpenAI
import httpx
import random
import time
from typing import Optional

from app.config import (
    AI_TEXT_API_URL,
    AI_TEXT_API_KEY,
    AI_IMAGE_API_URL,
    AI_IMAGE_API_KEY,
    AI_TEXT_MODEL,
    AI_IMAGE_MODEL,
    IMAGE_PROMPT,
    BLESSING_SYSTEM_PROMPT,
)

# 初始化 OpenAI 客户端（指向自托管服务）
text_client = AsyncOpenAI(
    base_url=AI_TEXT_API_URL,
    api_key=AI_TEXT_API_KEY,
)


async def generate_blessing_text(prompt: Optional[str] = None) -> str:
    """生成祝福语文本"""
    # 检查配置
    if not AI_TEXT_API_URL:
        raise Exception("AI_TEXT_API_URL 未配置，请在 .env 文件中设置")
    if not AI_TEXT_API_KEY:
        raise Exception("AI_TEXT_API_KEY 未配置，请在 .env 文件中设置")
    
    print(f"[AI] 调用文本API: {AI_TEXT_API_URL}, model={AI_TEXT_MODEL}")
    
    # 构建消息
    messages = [{"role": "system", "content": BLESSING_SYSTEM_PROMPT}]
    if prompt:
        messages.append({"role": "user", "content": prompt})
    messages.append({"role": "user", "content": "请结合上面的提示生成"})
    
    try:
        response = await text_client.chat.completions.create(
            model=AI_TEXT_MODEL,
            messages=messages,
            max_tokens=100,
            temperature=0.8,
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[AI] 文本生成错误: {e}")
        raise


# 随机修饰词池 - 用于增加生图的多样性
STYLE_MODIFIERS = [
    "vibrant colors", "soft tones", "warm lighting", "cool atmosphere",
    "dreamy style", "crisp details", "ethereal glow", "rich textures",
]
MOOD_MODIFIERS = [
    "joyful", "serene", "festive", "elegant", "harmonious", "peaceful",
    "lively", "graceful", "auspicious", "prosperous",
]
DETAIL_MODIFIERS = [
    "intricate patterns", "delicate brushwork", "flowing lines",
    "subtle gradients", "layered composition", "dynamic arrangement",
]


def build_random_prompt(base_prompt: str) -> str:
    """在基础提示词上添加随机元素，增加生成多样性"""
    # 随机选择修饰词
    style = random.choice(STYLE_MODIFIERS)
    mood = random.choice(MOOD_MODIFIERS)
    detail = random.choice(DETAIL_MODIFIERS)
    
    # 添加时间戳种子确保唯一性
    seed = int(time.time() * 1000) % 100000
    
    # 组合最终提示词
    enhanced_prompt = f"{base_prompt}, {style}, {mood}, {detail}, seed:{seed}"
    return enhanced_prompt


async def generate_image(prompt: Optional[str], width: int = 512, height: int = 512) -> str:
    """
    调用文生图 API 生成图片（兼容 OpenAI/ECNU 接口）
    
    提示词从 .env 配置读取，并添加随机元素增加多样性
    """
    if not AI_IMAGE_API_URL:
        raise Exception("AI_IMAGE_API_URL 未配置，请在 .env 文件中设置")
    if not AI_IMAGE_API_KEY:
        raise Exception("AI_IMAGE_API_KEY 未配置，请在 .env 文件中设置")
    
    # 转换尺寸为 size 格式，支持的尺寸: 512x512, 768x768, 720x1280, 1280x720, 1024x1024
    size = f"{width}x{height}"
    
    # 添加随机元素到提示词
    final_prompt = build_random_prompt(IMAGE_PROMPT)
    
    print(f"[AI] 调用图片API: {AI_IMAGE_API_URL}, model={AI_IMAGE_MODEL}, size={size}")
    print(f"[AI] 图片提示词: {final_prompt}")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {AI_IMAGE_API_KEY}"
            }
            
            payload = {
                "model": AI_IMAGE_MODEL,
                "prompt": final_prompt,
                "size": size,
                "response_format": "url",
            }
            
            response = await client.post(AI_IMAGE_API_URL, json=payload, headers=headers)
            result = response.json()
            print(f"[AI] 图片API返回: status={response.status_code}, result={result}")
            
            # 检查错误
            if "err_message" in result and result["err_message"]:
                raise Exception(f"图片生成失败: {result['err_message']}")
            
            if response.status_code != 200:
                raise Exception(f"图片生成失败: {result}")
            
            # 解析返回的图片 URL
            if "data" in result and len(result["data"]) > 0:
                url = result["data"][0].get("url") or result["data"][0].get("b64_json")
                print(f"[AI] 图片URL: {url}")
                return url
            else:
                raise Exception(f"图片生成返回格式异常: {result}")
    except httpx.RequestError as e:
        print(f"[AI] 网络错误: {e}")
        raise Exception(f"网络请求失败: {e}")
    except Exception as e:
        print(f"[AI] 图片生成异常: {e}")
        raise
