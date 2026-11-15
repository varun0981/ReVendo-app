FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=5051

WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
RUN mkdir -p /app/uploads

EXPOSE 5051
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=5 CMD node -e "fetch('http://127.0.0.1:5051/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
