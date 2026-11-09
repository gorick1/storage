# Storage app image. Built by GitHub Actions and used by the Home Assistant add-on (or run anywhere).
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data BODY_SIZE_LIMIT=60M
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY docker-entrypoint.mjs ./
EXPOSE 3000
VOLUME /data
CMD ["node", "--disable-warning=ExperimentalWarning", "docker-entrypoint.mjs"]
