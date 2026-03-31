# Use a lightweight Node.js base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first — Docker caches this layer so npm install
# only re-runs when dependencies actually change (faster rebuilds)
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the source code
COPY . .

# Expose the port the server listens on
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["node", "src/index.js"]
