FROM node as deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install


FROM node as builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
RUN npx prisma generate
RUN npm run build


FROM node
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY start.sh ./start.sh
RUN chmod 755 ./start.sh

EXPOSE 3000

CMD ["/app/start.sh"]