# ── Stage 1: Build React app ──────────────────────────────────────────────────
FROM node:20-alpine AS react-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Vite outputs to dist/client/
RUN npm run build

# ── Stage 2: Build TypeScript API server ──────────────────────────────────────
FROM node:20-alpine AS server-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# tsc outputs to dist/server/
RUN npm run build:server
# Copy proto file alongside the compiled JS so the runtime can load it
RUN cp -r server/proto dist/server/proto

# ── Stage 3: Final image (nginx + Node.js + supervisord) ──────────────────────
FROM node:20-alpine

RUN apk add --no-cache nginx supervisor

WORKDIR /app

# React static files → nginx document root
COPY --from=react-builder /app/dist/client /usr/share/nginx/html

# Compiled API server + proto files
COPY --from=server-builder /app/dist/server ./dist/server

# Runtime node_modules (grpc, express, etc.)
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/package.json ./

# nginx + supervisord config
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisord.conf

# HTTP (nginx)  + gRPC (API server)
EXPOSE 80 50051

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
