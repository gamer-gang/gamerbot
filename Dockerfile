FROM oven/bun:1

RUN apt update && apt install -y git openssl curl python3 build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libpng-dev libtiff5-dev libjpeg62-turbo-dev libopenjp2-7-dev libtiff-dev libwebp-dev libxml2-dev libfreetype6-dev liblcms2-dev libraqm-dev libharfbuzz-dev libfribidi-dev libfontconfig-dev libexif-dev libgsf-1-dev libpoppler-glib-dev libmagickwand-dev libheif-dev

# Prisma seems to require node in the container to generate the client
# source: https://github.com/oven-sh/bun/issues/4848#issuecomment-1713437567
ARG NODE_VERSION=20
RUN curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n \
    && bash n $NODE_VERSION \
    && rm n \
    && npm install -g n

ENV NODE_ENV=production DOCKER=true

WORKDIR /app

COPY --link package.json bun.lockb ./
COPY --link types types
RUN bun install --frozen-lockfile --force

COPY --link prisma prisma
RUN bun x prisma generate

COPY --link assets assets
COPY --link assets/NotoSerif-Regular.ttf /usr/share/fonts/

COPY --link lib lib
COPY --link scripts scripts

ARG GAMERBOT_VERSION=latest
ARG RELEASE_NAME=latest

RUN bun /app/scripts/buildinfo.ts ${GAMERBOT_VERSION} ${RELEASE_NAME}

CMD [ "bun", "start" ]
