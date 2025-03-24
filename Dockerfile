# Base image with Node.js
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the app
RUN npm run build:react && npm run build:electron

# Expose port for development server
EXPOSE 3000

# Command to run the app in development mode
CMD ["npm", "run", "dev:react"] 