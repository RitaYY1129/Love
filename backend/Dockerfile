FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "node scripts/init-db.js && node scripts/migrate-mobile-auth.js && node server.js"]

