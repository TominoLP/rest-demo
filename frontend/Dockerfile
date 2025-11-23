FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY public ./public
COPY server.js ./

EXPOSE 8080
CMD ["npm", "start"]
