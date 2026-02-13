FROM node:20-bookworm-slim AS build

RUN apt-get update \
  && apt-get install -y --no-install-recommends stockfish ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install workspace deps with good Docker caching by copying manifests first.
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/shared-contracts/package.json packages/shared-contracts/package.json

RUN npm install --include=dev

COPY . .

# Prisma schema lives under apps/api, but it generates @prisma/client into the root node_modules.
RUN npm run prisma:generate -w @chesstrainer/api \
  && npm run build -w @chesstrainer/api \
  && npm run build -w @chesstrainer/worker

FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends stockfish ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app /app

# Render injects $PORT; the API reads it and binds 0.0.0.0:$PORT.
EXPOSE 3000

CMD ["bash", "scripts/render-start.sh"]

