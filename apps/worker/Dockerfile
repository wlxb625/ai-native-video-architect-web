FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/graph-runtime/package.json packages/graph-runtime/package.json
RUN npm install
COPY apps/worker apps/worker
COPY packages/graph-runtime packages/graph-runtime
COPY graphs graphs
RUN npm -w @cineweave/graph-runtime run build && npm -w @cineweave/worker run build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/worker/dist ./apps/worker/dist
COPY --from=build /app/packages/graph-runtime/dist ./packages/graph-runtime/dist
COPY --from=build /app/graphs ./graphs
COPY package.json ./package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/graph-runtime/package.json packages/graph-runtime/package.json
CMD ["node","apps/worker/dist/index.js"]
