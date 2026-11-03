FROM node:24-slim
RUN corepack enable
WORKDIR /app
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY --chown=node:node . .
RUN pnpm build && chown -R node:node /app/.next
# The SQLite file lives in a named volume at /data/data. Creating the folder here, owned by node,
# makes Docker give a new volume the same owner (otherwise it is root-owned and ingest cannot write).
RUN mkdir -p /data/data && chown -R node:node /data
# Corpora, caches, runs and the SQLite file live under /data (mounted from the checkout).
ENV ATLAS_DATA_DIR=/data NODE_ENV=production
USER node
EXPOSE 3000
CMD ["pnpm", "start", "--port", "3000"]
