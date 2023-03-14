FROM node:18-alpine as builder

RUN apk add --no-cache git openssl

WORKDIR /app

COPY .yarn .yarn
COPY package.json yarn.lock .yarnrc.yml ./
COPY types types
COPY patches patches
COPY prisma/schema.prisma prisma/schema.prisma
RUN yarn install --immutable --inline-builds

COPY . .
RUN yarn build

FROM node:18-alpine as runner

RUN apk add --no-cache git openssl

ENV NODE_ENV=production DOCKER=true

WORKDIR /app

COPY assets/NotoSerif-Regular.ttf /usr/share/fonts/

COPY assets assets
COPY prisma prisma
COPY package.json yarn.lock ./
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/dist dist

RUN ./node_modules/.bin/prisma generate

USER node

CMD [ "node", "/app/dist/index.js" ]
