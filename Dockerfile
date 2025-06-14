FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy app source
COPY . .

# Production image
FROM node:18-alpine

# Install production dependencies only
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Copy app from build stage
COPY --from=build /app .

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Create a non-root user and switch to it
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodeuser && \
    chown -R nodeuser:nodejs /app
USER nodeuser

# Command to run the application
CMD ["node", "server.js"] 