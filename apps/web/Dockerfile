FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm install
COPY apps/web apps/web
COPY packages/contracts packages/contracts
ARG VITE_API_BASE_URL=http://localhost:8780/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm -w @cineweave/contracts run build && npm -w @cineweave/web run build
FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
