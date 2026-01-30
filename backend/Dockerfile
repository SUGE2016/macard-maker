FROM docker.1ms.run/python:3.12-slim

WORKDIR /app

# 使用国内 PyPI 镜像加速
ENV PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple \
    PIP_TRUSTED_HOST=pypi.tuna.tsinghua.edu.cn

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 数据目录（SQLite、上传等可挂载卷持久化）
ENV DATABASE_URL=sqlite+aiosqlite:///./data/data.db
RUN mkdir -p /app/data

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
