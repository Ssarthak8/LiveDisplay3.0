FROM node:20-slim AS builder
WORKDIR /app
COPY package.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/server ./apps/server
RUN npm install --workspace=packages/shared-types --workspace=apps/server
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=apps/server

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/package.json
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/package.json ./package.json
EXPOSE 5000
CMD ["node", "apps/server/dist/index.js"]
