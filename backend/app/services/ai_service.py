import asyncio
import hashlib
import hmac
import httpx
import json
import random
import time
from datetime import datetime, timezone
from typing import Optional

from app.config import (
    AI_IMAGE_PROVIDER,
    AI_IMAGE_API_URL,
    AI_IMAGE_API_KEY,
    AI_IMAGE_MODEL,
    AI_IMAGE_SIZE,
    VOLC_ACCESS_KEY,
    VOLC_SECRET_KEY,
    AI_IMAGE_WIDTH,
    AI_IMAGE_HEIGHT,
    IMAGE_PROMPT,
)


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

# 即梦 API 常量
JIMENG_HOST = "visual.volcengineapi.com"
JIMENG_REQ_KEY = "jimeng_t2i_v31"
JIMENG_REGION = "cn-north-1"
JIMENG_SERVICE = "cv"
POLL_INTERVAL = 2   # 轮询间隔（秒）
MAX_POLL_COUNT = 60  # 最大轮询次数


# ============ 火山引擎签名（官方 HMAC-SHA256） ============

def _hmac_sha256(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()


def _hash_sha256(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def _volc_signed_headers(action: str, body: str) -> dict:
    """按火山引擎官方签名规范生成 Headers"""
    now = datetime.now(timezone.utc)
    x_date = now.strftime("%Y%m%dT%H%M%SZ")
    short_date = x_date[:8]
    x_content_sha256 = _hash_sha256(body)

    # 参与签名的 headers（按 key 排序）
    signed_headers_str = "content-type;host;x-content-sha256;x-date"
    canonical_headers = "\n".join([
        "content-type:application/json",
        f"host:{JIMENG_HOST}",
        f"x-content-sha256:{x_content_sha256}",
        f"x-date:{x_date}",
    ])

    # query string（按 key 排序）
    canonical_querystring = f"Action={action}&Version=2022-08-31"

    # 规范请求
    canonical_request = "\n".join([
        "POST",
        "/",
        canonical_querystring,
        canonical_headers,
        "",
        signed_headers_str,
        x_content_sha256,
    ])

    # 待签字符串
    credential_scope = f"{short_date}/{JIMENG_REGION}/{JIMENG_SERVICE}/request"
    string_to_sign = "\n".join([
        "HMAC-SHA256",
        x_date,
        credential_scope,
        _hash_sha256(canonical_request),
    ])

    # 计算签名
    k_date = _hmac_sha256(VOLC_SECRET_KEY.encode("utf-8"), short_date)
    k_region = _hmac_sha256(k_date, JIMENG_REGION)
    k_service = _hmac_sha256(k_region, JIMENG_SERVICE)
    k_signing = _hmac_sha256(k_service, "request")
    signature = _hmac_sha256(k_signing, string_to_sign).hex()

    authorization = (
        f"HMAC-SHA256 Credential={VOLC_ACCESS_KEY}/{credential_scope}, "
        f"SignedHeaders={signed_headers_str}, Signature={signature}"
    )
    return {
        "Content-Type": "application/json",
        "Host": JIMENG_HOST,
        "X-Content-Sha256": x_content_sha256,
        "X-Date": x_date,
        "Authorization": authorization,
    }


# ============ 通用 ============

def build_random_prompt(base_prompt: str) -> str:
    """在基础提示词上添加随机元素，增加生成多样性"""
    style = random.choice(STYLE_MODIFIERS)
    mood = random.choice(MOOD_MODIFIERS)
    detail = random.choice(DETAIL_MODIFIERS)
    seed = int(time.time() * 1000) % 100000
    enhanced_prompt = f"{base_prompt}, {style}, {mood}, {detail}, seed:{seed}"
    return enhanced_prompt


async def generate_image(prompt: Optional[str], width: int = None, height: int = None) -> str:
    """根据 AI_IMAGE_PROVIDER 配置分发到对应后端"""
    if AI_IMAGE_PROVIDER == "jimeng":
        return await _generate_image_jimeng(prompt, width, height)
    else:
        return await _generate_image_ecnu(prompt, width, height)


# ============ ECNU ============

async def _generate_image_ecnu(prompt: Optional[str], width: int = None, height: int = None) -> str:
    """调用 ECNU 文生图 API（OpenAI 兼容接口）"""
    if not AI_IMAGE_API_URL or not AI_IMAGE_API_KEY:
        raise Exception("AI_IMAGE_API_URL/AI_IMAGE_API_KEY 未配置，请在 .env 文件中设置")

    size = AI_IMAGE_SIZE
    final_prompt = build_random_prompt(IMAGE_PROMPT)

    print(f"[AI] ECNU文生图: model={AI_IMAGE_MODEL}, size={size}")
    print(f"[AI] 提示词: {final_prompt}")

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
            print(f"[AI] ECNU返回: status={response.status_code}, result={result}")

            if "err_message" in result and result["err_message"]:
                raise Exception(f"图片生成失败: {result['err_message']}")
            if response.status_code != 200:
                raise Exception(f"图片生成失败: {result}")

            if "data" in result and len(result["data"]) > 0:
                url = result["data"][0].get("url") or result["data"][0].get("b64_json")
                print(f"[AI] 图片URL: {url}")
                return url
            else:
                raise Exception(f"图片生成返回格式异常: {result}")
    except Exception as e:
        print(f"[AI] ECNU图片生成异常: {e}")
        raise


# ============ 即梦 ============

async def _jimeng_post(action: str, body_dict: dict) -> dict:
    """向即梦 API 发送签名请求"""
    body = json.dumps(body_dict)
    headers = _volc_signed_headers(action, body)
    url = f"https://{JIMENG_HOST}?Action={action}&Version=2022-08-31"

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(url, content=body, headers=headers)
        return resp.json()


async def _generate_image_jimeng(prompt: Optional[str], width: int = None, height: int = None) -> str:
    """调用即梦文生图 3.1 API（异步两步：提交任务 + 轮询结果）"""
    if not VOLC_ACCESS_KEY or not VOLC_SECRET_KEY:
        raise Exception("VOLC_ACCESS_KEY/VOLC_SECRET_KEY 未配置，请在 .env 文件中设置")

    w = AI_IMAGE_WIDTH
    h = AI_IMAGE_HEIGHT
    final_prompt = build_random_prompt(IMAGE_PROMPT)

    print(f"[AI] 即梦文生图: size={w}x{h}")
    print(f"[AI] 提示词: {final_prompt}")

    try:
        # Step 1: 提交任务
        submit_resp = await _jimeng_post("CVSync2AsyncSubmitTask", {
            "req_key": JIMENG_REQ_KEY,
            "prompt": final_prompt,
            "width": w,
            "height": h,
            "seed": -1,
        })
        print(f"[AI] 提交任务返回: {submit_resp}")

        if submit_resp.get("code") != 10000:
            raise Exception(f"提交任务失败: {submit_resp.get('message', submit_resp)}")

        task_id = submit_resp["data"]["task_id"]
        print(f"[AI] 任务已提交, task_id={task_id}")

        # Step 2: 轮询查询结果
        for i in range(MAX_POLL_COUNT):
            await asyncio.sleep(POLL_INTERVAL)
            result = await _jimeng_post("CVSync2AsyncGetResult", {
                "req_key": JIMENG_REQ_KEY,
                "task_id": task_id,
                "req_json": '{"return_url":true}',
            })
            code = result.get("code")
            data = result.get("data") or {}
            status = data.get("status", "")

            print(f"[AI] 轮询 #{i+1}: code={code}, status={status}")

            if code != 10000:
                raise Exception(f"查询任务失败: {result.get('message', result)}")

            if status == "done":
                image_urls = data.get("image_urls", [])
                if image_urls:
                    print(f"[AI] 图片URL: {image_urls[0]}")
                    return image_urls[0]
                raise Exception(f"任务完成但无图片URL: {result}")

            if status in ("not_found", "expired"):
                raise Exception(f"任务异常: status={status}")

        raise Exception("图片生成超时（轮询超过120秒）")

    except Exception as e:
        print(f"[AI] 即梦图片生成异常: {e}")
        raise
