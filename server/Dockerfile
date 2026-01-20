FROM node:20-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json* ./
RUN npm install

COPY server/ .
RUN npm run build


# Expose backend port
EXPOSE 8000

# Start server
CMD ["node", "dist/server.js"]
