# Base image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install required packages
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "server.js"]
