# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Expose port - Azure Web App for Containers uses 8080
EXPOSE 8080

# Set PORT environment variable for Azure
ENV PORT=8080

# Start the application
CMD ["npm", "start"]
