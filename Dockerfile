# ---- Build stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Native modules compatibility (e.g., sharp) and build tools
RUN apk add --no-cache libc6-compat python3 make g++

# Install dependencies (use lockfile if present)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source and build
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN apk add --no-cache libc6-compat

# Copy only build output
COPY --from=builder /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
