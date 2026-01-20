FROM node:20-alpine

WORKDIR /app

# Install deps first
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Expose backend port
EXPOSE 8000

# Start server
CMD ["node", "dist/server.js"]
