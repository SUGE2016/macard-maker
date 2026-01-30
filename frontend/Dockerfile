# 仅负责构建环境；运行时执行 build，产物写到挂载的目录（compose 里挂载 ./frontend-dist）
FROM docker.1ms.run/node:20-alpine

WORKDIR /app

# 使用国内 npm 镜像加速
RUN npm config set registry https://registry.npmmirror.com

COPY . .
RUN npm ci
# 不在镜像里 build；运行时再 build，产物才会写到挂载的 ./frontend-dist
CMD ["npm", "run", "build"]

