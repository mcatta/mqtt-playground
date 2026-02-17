FROM node:18-alpine

# Debug: show what's in the build context
RUN echo "=== Build context root ===" && ls -la / || true
RUN echo "=== Current directory ===" && pwd && ls -la . || true

WORKDIR /app

# Copy everything to see what we have
COPY . .

# Debug: show what was copied
RUN echo "=== After COPY . . ===" && ls -la /app
RUN echo "=== Looking for package.json ===" && find /app -name "package.json" -type f

# Install dependencies
RUN npm install --omit=dev

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Start the application
CMD ["node", "src/index.js"]
