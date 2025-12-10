FROM node:22-alpine

WORKDIR /app

# Update npm to latest version
RUN npm install -g npm@11.7.0

# Install dependencies during build (for caching)
COPY package*.json ./
RUN npm install

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy application code
COPY . .

# Expose port
EXPOSE 3030

# Use entrypoint that ensures dependencies are installed
ENTRYPOINT ["/docker-entrypoint.sh"]

# Start development server
CMD ["npm", "run", "dev", "--", "--host"]

