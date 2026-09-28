# Build + run the SvelteKit admin console (adapter-node), using pnpm via corepack.
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
# Directory for the lightweight role-definition JSON store.
RUN mkdir -p /app/.data
ENV CONSOLE_DATA_DIR=/app/.data
EXPOSE 3000
CMD ["node", "build/index.js"]
