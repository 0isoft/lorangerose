FROM node:20-alpine

WORKDIR /app
RUN npm i -g npm@latest

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000
