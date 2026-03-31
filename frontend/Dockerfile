# --- Stage 1: Build ---
# Use Node to install dependencies and compile the React app into static files
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# VITE_API_URL is passed in at build time so the compiled app knows
# where the backend is (set it in docker-compose or your CI pipeline)
ARG VITE_API_URL=http://localhost:3001/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- Stage 2: Serve ---
# Use a tiny nginx image to serve the built files — no Node.js needed at runtime
FROM nginx:alpine

# Copy our built React files into nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config to support React Router (single-page app routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
