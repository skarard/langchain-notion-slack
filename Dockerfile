# Build image
FROM node AS builder
WORKDIR /usr/src/app
COPY . .
RUN npm ci
RUN npm run build
RUN rm -rf node_modules
RUN npm ci --production

# Production image
FROM node AS runner
WORKDIR /usr/src/app

ENV NODE_ENV production

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/build ./build

CMD ["node", "build/index.js"]
