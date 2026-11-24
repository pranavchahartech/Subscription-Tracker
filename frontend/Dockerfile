# Multi-stage production Dockerfile for SubSpace Frontend (React 19 + Vite -> Nginx)

# ── Stage 1: Build static assets ─────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first for better Docker layer caching
COPY package*.json ./
RUN npm ci

# Copy frontend source
COPY . .

# Default VITE_API_URL to empty string so axios uses relative URLs (/api/...)
# routed through nginx, avoiding hardcoding any server IP into the JS bundle.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Serve static files with Nginx ───────────────────────────────────
FROM nginx:alpine

# Replace default nginx site config with our reverse-proxy + SPA config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy only the compiled production bundle from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Verify nginx is serving the frontend
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
