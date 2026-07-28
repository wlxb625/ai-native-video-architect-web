FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm install
COPY apps/api apps/api
COPY packages/contracts packages/contracts
RUN npm -w @cineweave/contracts run build && npm -w @cineweave/api run build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/contracts/dist ./packages/contracts/dist
COPY package.json ./package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
EXPOSE 8780
CMD ["node","apps/api/dist/server.js"]
