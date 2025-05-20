# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# install dependencies first for cache efficiency
COPY package*.json ./
RUN npm ci

# copy source & build (tsc / vite / etc.)
COPY . .
RUN npm run build          # if you compile TS to JS
# if you run ts-node directly in prod, skip this line

# ---------- run stage ----------
FROM node:20-alpine
WORKDIR /app

# copy only the built output and node_modules
COPY --from=build /app .   ./

# expose your API port
EXPOSE 5001

# env vars go in docker-compose, not here
CMD ["node", "dist/index.js"]