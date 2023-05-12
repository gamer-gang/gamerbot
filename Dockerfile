FROM node:18-alpine

RUN apk add --no-cache git openssl

ENV NODE_ENV=production DOCKER=true

WORKDIR /app

COPY .yarn .yarn
COPY package.json yarn.lock .yarnrc.yml ./
COPY prisma prisma
COPY types types
RUN yarn install --immutable --inline-builds
RUN ./node_modules/.bin/prisma generate

COPY assets assets
COPY assets/NotoSerif-Regular.ttf /usr/share/fonts/

COPY dist dist

CMD [ "node", "/app/dist/index.js" ]
