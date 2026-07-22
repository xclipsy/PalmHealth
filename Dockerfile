FROM node:20-alpine

# Instala bash y cliente PostgreSQL para migraciones
RUN apk add --no-cache bash postgresql-client

WORKDIR /app

# Copia manifiestos de dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Instala pnpm y dependencias en el contenedor
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copia el código fuente (respetando .dockerignore)
COPY . .

RUN sed -i 's/\r$//' scripts/*.sh && chmod +x scripts/*.sh

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Aplica migraciones e inicia el backend
CMD ["sh", "-c", "bash scripts/run-migrations.sh && pnpm --filter palm-health-backend start"]
