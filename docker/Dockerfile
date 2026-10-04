FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public

# Vite embeds these public settings in the browser bundle at build time.
# Private credentials belong in the external Worker, never in this image.
ARG VITE_BILLING_API_URL
ARG VITE_STRIPE_ENABLED=false
ARG VITE_FIREBASE_AUTH_DOMAIN=ceoaberto-neuroia.firebaseapp.com
RUN npm run build -- --base /

FROM nginx:alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
