FROM node:20-slim AS builder
WORKDIR /app
COPY package.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/client ./apps/client
RUN npm install --workspace=packages/shared-types --workspace=apps/client
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=apps/client

FROM nginx:alpine
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
