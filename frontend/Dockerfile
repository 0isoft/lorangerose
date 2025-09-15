FROM node:20-alpine

WORKDIR /app
RUN npm i -g npm@latest

# Copy manifest first for layer caching
COPY package.json ./
# Install deps inside image (no host install)
RUN npm install

# Then copy the rest
COPY . .

EXPOSE 5173
