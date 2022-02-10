FROM node:lts-alpine as builder

WORKDIR /app

COPY .yarn .yarn
COPY package.json yarn.lock .yarnrc.yml ./
COPY types types
COPY prisma/schema.prisma prisma/schema.prisma
RUN yarn install --immutable --inline-builds

COPY . .
RUN yarn build

FROM node:lts-alpine as runner

ENV NODE_ENV=production DOCKER=true

WORKDIR /app

COPY assets assets
COPY prisma prisma
COPY package.json yarn.lock ./
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/dist dist

RUN ./node_modules/.bin/prisma generate

USER node

CMD [ "node", "./dist/main.mjs" ]
