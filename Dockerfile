FROM mhart/alpine-node:10.19 AS builder

WORKDIR /srv

COPY . .
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh libc6-compat

RUN apk add --no-cache --virtual .gyp \
        python3 \
        make \
        g++ \
    && yarn \
    && apk del .gyp

RUN yarn build

# use lighter image
FROM mhart/alpine-node:slim-10.19
RUN apk add libc6-compat
COPY --from=builder /srv .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "build/index.js"]