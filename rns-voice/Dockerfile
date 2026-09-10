# Runs the RNS voice agent anywhere that takes a container: Render, Railway,
# Fly.io, a VPS, or Hostinger's VPS tier. Nothing here compiles, so the build
# is a few seconds.
FROM node:20-alpine

WORKDIR /app

# Dependencies first, so a code change does not reinstall them.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

# Campaign data lives here; mount a volume to keep it across deploys.
RUN mkdir -p /app/data
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# The platform's health check hits this; it answers before any credentials are set.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "app.js"]
