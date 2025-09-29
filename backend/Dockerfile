FROM node:20-alpine

WORKDIR /app
RUN npm i -g npm@latest
RUN chown -R node:node /app
USER node

COPY --chown=node:node package.json ./
RUN npm install

COPY --chown=node:node . .

EXPOSE 3000
