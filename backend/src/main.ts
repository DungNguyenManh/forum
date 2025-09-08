
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3001;

  // Security headers
  app.use(helmet());

  // CORS disabled by default. To enable, set env CORS_ENABLE=true
  if (process.env.CORS_ENABLE === 'true') {
    const allowlist = (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const corsOrigin = allowlist.length > 0 ? allowlist : true;
    app.enableCors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });
  }

  // Bật validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Loại bỏ thuộc tính không có trong DTO
    forbidNonWhitelisted: true, // Throw error nếu có thuộc tính không hợp lệ
    transform: true,           // Tự động chuyển đổi type
  }));

  app.setGlobalPrefix('api/v1', { exclude: [''] });

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();