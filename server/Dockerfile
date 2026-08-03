FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production --ignore-scripts && \
    npm cache clean --force
RUN mkdir -p /app/audio && chown nodeuser:nodejs /app/audio
USER nodeuser
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]