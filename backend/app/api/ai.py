from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import httpx

from app.services.ai_service import generate_blessing_text, generate_image

router = APIRouter()


class GenerateTextRequest(BaseModel):
    prompt: Optional[str] = None  # 可选的提示词，如果为空则完全自动生成


class GenerateTextResponse(BaseModel):
    text: str


class GenerateImageRequest(BaseModel):
    prompt: str
    width: int = 512
    height: int = 512


class GenerateImageResponse(BaseModel):
    image_url: str


@router.post("/generate-text", response_model=GenerateTextResponse)
async def api_generate_text(request: GenerateTextRequest):
    """生成祝福语文本"""
    try:
        text = await generate_blessing_text(request.prompt)
        return GenerateTextResponse(text=text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成文本失败: {str(e)}")


@router.post("/generate-image", response_model=GenerateImageResponse)
async def api_generate_image(request: GenerateImageRequest):
    """生成图片/背景"""
    try:
        image_url = await generate_image(request.prompt, request.width, request.height)
        return GenerateImageResponse(image_url=image_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成图片失败: {str(e)}")


@router.get("/image-proxy")
async def image_proxy(url: str):
    """代理外部图片，解决 CORS 问题"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            return StreamingResponse(
                iter([response.content]),
                media_type=response.headers.get("content-type", "image/png"),
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图片代理失败: {str(e)}")

