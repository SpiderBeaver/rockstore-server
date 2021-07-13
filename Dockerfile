FROM node:16

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]

RUN npm install

COPY dist dist
COPY prisma prisma
COPY start.sh start.sh

EXPOSE 3000

CMD ["/app/start.sh"]