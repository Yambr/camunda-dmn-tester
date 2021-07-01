# этап сборки (build stage)
FROM node:lts-alpine as build-stage
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:server

EXPOSE 3000
CMD [ "node", "./dist/server/app.js" ]