# syntax=docker/dockerfile:1

# 1) Dependencies layer (installs all deps including dev for building)
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) Build layer (builds client and bundles server)
FROM deps AS build
COPY . .
ENV NODE_ENV=production
RUN npm run build
# prune dev dependencies to only production for the runtime image
RUN npm prune --omit=dev

# 3) Runtime layer (minimal, only prod deps and built artifacts)
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only what's required to run
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist

# Run as non-root user for security
USER node

# The app listens on 5000 (see server/index.ts)
EXPOSE 5000

# Start the production server
CMD ["node", "dist/index.js"]