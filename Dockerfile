# syntax=docker/dockerfile:1

# ---- Build del frontend ----
FROM node:24-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- Aplicación final (un solo contenedor) ----
FROM node:24-slim AS runtime

ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/data/pomodoro.db

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY backend/src ./backend/src
COPY --from=frontend-build /app/frontend/dist ./public

RUN mkdir -p /app/data

EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "backend/src/server.js"]
