FROM node:20-alpine
RUN apk add --no-cache docker-cli openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 4001
CMD ["npm", "run", "dev"]
