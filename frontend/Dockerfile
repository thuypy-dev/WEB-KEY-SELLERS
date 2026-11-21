# ==========================================
# STAGE 1: Build React Vite
# ==========================================
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Cho phép truyền URL của Backend khi build qua Docker ARG / ENV (Mặc định để trống để Nginx reverse proxy đa năng)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ==========================================
# STAGE 2: Nginx Serve Production
# ==========================================
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
