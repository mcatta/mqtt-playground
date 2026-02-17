# Single-stage build for Next.js
FROM node:18-alpine

WORKDIR /app

# Copy everything from build context
COPY . .

# Install dependencies
RUN npm install

# Build Next.js app
RUN npm run build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["npm", "start"]
