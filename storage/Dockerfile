# Home Assistant builds this add-on locally. It fetches the app source for the
# release that matches this add-on's version, builds it, and runs it.
ARG BUILD_VERSION=0.1.0
FROM node:24-alpine AS build
ARG BUILD_VERSION
RUN apk add --no-cache git
RUN git clone --depth 1 --branch "v${BUILD_VERSION}" https://github.com/gorick1/storage.git /src
WORKDIR /src
RUN npm ci && npm run build && npm prune --omit=dev

FROM node:24-alpine
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data BODY_SIZE_LIMIT=60M
WORKDIR /app
COPY --from=build /src/build ./build
COPY --from=build /src/node_modules ./node_modules
COPY --from=build /src/package.json /src/docker-entrypoint.mjs ./
EXPOSE 3000
CMD ["node", "--disable-warning=ExperimentalWarning", "docker-entrypoint.mjs"]
