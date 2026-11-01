FROM node:24-slim
RUN corepack enable
WORKDIR /app
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY --chown=node:node . .
RUN pnpm build && chown -R node:node /app/.next
# Corpora, caches, runs and the SQLite file live under /data (mounted from the checkout).
ENV ATLAS_DATA_DIR=/data NODE_ENV=production
USER node
EXPOSE 3000
CMD ["pnpm", "start", "--port", "3000"]
