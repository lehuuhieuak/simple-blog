# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Accept build arguments
ARG NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create .env.local with build argument
RUN echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" > .env.local

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]