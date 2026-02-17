FROM node:18-alpine

WORKDIR /app

# Copy entire repository
COPY . .

# Change to logger directory where package.json actually is
WORKDIR /app/logger

# Install dependencies
RUN npm install --omit=dev

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app/logger

USER nodejs

# Start the application
CMD ["node", "src/index.js"]
