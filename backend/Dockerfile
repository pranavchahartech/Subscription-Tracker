# Production Dockerfile for SubSpace Backend (Node.js / Express)
FROM node:20-alpine

# Run Express in production mode (disables dev Swagger UI and switches logger to JSON)
ENV NODE_ENV=production

WORKDIR /app

# Install production dependencies first to leverage Docker layer caching
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code
COPY src/ ./src/

# Run as the built-in non-root 'node' user for container security
RUN chown -R node:node /app
USER node

EXPOSE 4000

# Container health check hitting the Express /health endpoint (verifies app + PostgreSQL)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/app.js"]
