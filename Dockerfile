FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

FROM node:24-alpine AS runtime
RUN apk add --no-cache ca-certificates \
  && update-ca-certificates \
  && addgroup -S -g 10001 northstar \
  && adduser -S -u 10001 -G northstar northstar
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=10001:10001 /app/dist ./dist
COPY --chown=10001:10001 server ./server
USER 10001:10001
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:3001/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/index.js"]
