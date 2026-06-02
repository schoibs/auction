# DEVELOPMENT IMAGE: installs all dependencies and runs Nest in watch/dev mode.
FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# BUILD IMAGE: compiles TypeScript into the dist/ directory
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# PRODUCTION IMAGE: keeps only production dependencies and compiled output
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
# Bring in the compiled app from the build stage instead of copying source files
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
