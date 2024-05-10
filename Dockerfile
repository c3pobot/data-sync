FROM node:20-alpine AS builder
COPY package*.json ./
# don't install dev dependencies for the docker image
RUN npm install --omit=dev

FROM node:20-alpine AS app
LABEL org.opencontainers.image.source https://github.com/c3pobot/data-sync
WORKDIR /app
ENV NODE_PATH=/app
RUN mkdir -p /app/data/files && chown -R node:node /app/data/files
RUN apk update && \
  # wrap process in --init in order to handle kernel signals
  # https://github.com/krallin/tini#using-tini
  apk add --no-cache tini git && \
  rm -rf /var/cache/apk/*

COPY --from=builder node_modules node_modules/
COPY package*.json ./
COPY index.js index.js
COPY src ./src

USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD [ "node", "./index.js" ]
