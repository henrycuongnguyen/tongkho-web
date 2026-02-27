# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Build-time arguments for prerendering
ARG DATABASE_URL
ARG ES_URL
ARG ES_INDEX
ARG ES_API_KEY
ARG SEO_ES_INDEX=seo_meta_data
ARG PUBLIC_SITE_URL=https://tongkhobds.com
ARG PUBLIC_API_URL=
ARG PUBLIC_IMAGE_SERVER_URL=https://quanly.tongkhobds.com

# Set as env vars for the build process
ENV DATABASE_URL=${DATABASE_URL}
ENV ES_URL=${ES_URL}
ENV ES_INDEX=${ES_INDEX}
ENV ES_API_KEY=${ES_API_KEY}
ENV SEO_ES_INDEX=${SEO_ES_INDEX}
ENV PUBLIC_SITE_URL=${PUBLIC_SITE_URL}
ENV PUBLIC_API_URL=${PUBLIC_API_URL}
ENV PUBLIC_IMAGE_SERVER_URL=${PUBLIC_IMAGE_SERVER_URL}

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files for production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Set default environment variables (can be overridden at runtime)
ENV HOST=0.0.0.0
ENV PORT=4321

# Expose port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4321/ || exit 1

# Run Astro Node.js server
CMD ["node", "./dist/server/entry.mjs"]
