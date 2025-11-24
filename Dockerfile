FROM node:20-alpine
WORKDIR /app

# Copy and install backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --omit=dev

# Copy and install frontend dependencies
WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install --omit=dev

# Copy backend files
WORKDIR /app/backend
COPY backend/server.js ./

# Copy frontend files
WORKDIR /app/frontend
COPY frontend/public ./public
COPY frontend/server.js ./

# Expose both ports
EXPOSE 3000 8080

# Start both services
WORKDIR /app
COPY start.sh ./
RUN chmod +x start.sh
CMD ["./start.sh"]