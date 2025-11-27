# ------------------------------------
# Stage 1: Build Vite App
# ------------------------------------
FROM node:20-alpine AS build

# Set working directory inside frontend folder
WORKDIR /app

# Copy package.json & lockfile FIRST (for caching)
COPY ./package*.json ./

RUN npm install

# Copy .env.production if exists
COPY .env.production .env.production

# Copy remaining project files
COPY . .

# Build frontend
RUN npm run build

# ------------------------------------
# Stage 2: Serve with Nginx
# ------------------------------------
FROM nginx:alpine

# Clear default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend
COPY --from=build /app/dist /usr/share/nginx/html

# Use custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Open port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

