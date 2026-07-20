FROM node:20-alpine

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages ./packages
COPY database ./database

RUN npm install --workspace=apps/api --include-workspace-root

COPY apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["npm", "run", "dev"]
