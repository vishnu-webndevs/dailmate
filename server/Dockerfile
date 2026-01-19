FROM node:20-alpine
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build the application
RUN npm run build

CMD ["node","dist/server.js"]
