# Use Node.js 22 to match deployment logs
FROM node:22-slim

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy all files
COPY . .

# Expose default Wrangler dev port
EXPOSE 8787

# Run Wrangler dev for local development
CMD ["npm", "run", "dev"]