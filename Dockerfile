# --- Deps ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --legacy-peer-deps: package.json-д react ^18.0.0 гэж заасан ч next@16-д
# >=18.2.0 шаардлагатай тул strict `npm ci` ERESOLVE алдаа өгдөг байсан.
# Энэ нь одоогийн (npm install-аар ажилладаг) resolution-той ижил, зөвхөн
# ci-ийн strict шалгалтыг тойрч гарна — өөр ямар ч version өөрчлөгддөггүй.
RUN npm ci --legacy-peer-deps

# --- Build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG API=https://api.zunailbar.mn/api/v1/
ENV API=${API}
RUN npm run build

# --- Runtime (Next.js standalone) ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
CMD ["node", "server.js"]
