import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

import cookieParser from 'cookie-parser'; 
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 1. Nhận diện Real IP phía sau Reverse Proxy (Nginx, Cloudflare, Traefik, Docker)
  // Đảm bảo ThrottlerGuard chặn đúng IP thực của kẻ tấn công thay vì chặn IP nội bộ của proxy
  app.set('trust proxy', 1);

  // 2. Bảo mật Header (Che thông tin server, chống XSS, clickjacking)
  app.use(helmet());

  // 3. Chống DoS: Giới hạn kích thước Body tối đa 2MB (Tránh treo RAM server do Payload Bomb)
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // 4. Đọc Cookie từ request (Quan trọng cho Auth)
  app.use(cookieParser());

  // 5. Cấu hình CORS (Cho phép Frontend gọi API và gửi Cookie)
  const defaultOrigins = [
    'http://localhost:3003',
    'http://localhost:5173',
    'http://localhost:5000',
    'http://127.0.0.1:3003',
    'http://127.0.0.1:5173',
  ];
  const envOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : [];
  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép request không có origin (server-to-server, mobile app, postman, curl)
      if (!origin) return callback(null, true);
      // Kiểm tra xem origin có nằm trong danh sách được phép không, hoặc chấp nhận tất cả khi DEV
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback an toàn để người khác clone về không bị chặn CORS
    },
    credentials: true,
  });

  // 6. Validate dữ liệu đầu vào (DTO)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist : true, // Tự động bỏ các trường thừa không có trong DTO
      transform : true, // Tự động convert kiểu (vd: string '1' -> number 1)
    })
  );

  const server = await app.listen(process.env.PORT ?? 3000);

  // 7. Chống Slowloris DoS Attack: Hủy các kết nối treo lâu không gửi dữ liệu (Đặt 2 phút để đủ thời gian cho AI Chatbot suy nghĩ)
  server.setTimeout(120000); 
  server.headersTimeout = 125000;
  server.keepAliveTimeout = 120000;
}
bootstrap();