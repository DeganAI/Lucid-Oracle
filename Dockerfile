# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install ALL dependencies (including dev for build)
RUN npm install --legacy-peer-deps

# Copy TypeScript config
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json ./

# Install only production dependencies
RUN npm install --production --legacy-peer-deps && \
    npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy necessary files (circuits directory - can be empty)
COPY circuits ./circuits

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run application
CMD ["node", "dist/index.js"]
```

# 📁 `.dockerignore` (Complete - Updated)
```
node_modules
npm-debug.log
dist
.env
.env.local
.env.production
.env.test
.git
.gitignore
README.md
DEPLOYMENT.md
API_EXAMPLES.md
GETTING_STARTED.md
CHANGELOG.md
PROJECT_SUMMARY.md
CONTRIBUTING.md
.DS_Store
*.md
.vscode
.idea
.railway
.vercel
coverage
.nyc_output
setup.sh
.github
Dockerfile
docker-compose.yml
.dockerignore
