FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS dev

WORKDIR /app
ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

FROM node:22-alpine AS build

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
ARG NEXT_PUBLIC_AUCTION_MIN_DURATION_SECONDS=30
ARG NEXT_PUBLIC_AUCTION_MAX_DURATION_SECONDS=604800

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_AUCTION_MIN_DURATION_SECONDS=$NEXT_PUBLIC_AUCTION_MIN_DURATION_SECONDS
ENV NEXT_PUBLIC_AUCTION_MAX_DURATION_SECONDS=$NEXT_PUBLIC_AUCTION_MAX_DURATION_SECONDS

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS prod

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]

