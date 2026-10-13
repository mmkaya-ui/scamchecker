FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 3001

CMD ["node", "server/index.js"]
