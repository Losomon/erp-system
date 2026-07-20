FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages ./packages

RUN npm install --workspace=apps/web --include-workspace-root

COPY apps/web ./apps/web

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["npm", "run", "dev"]
