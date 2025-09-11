
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3001;

  // Security headers
  app.use(helmet());

  // CORS: bật mặc định (đặt CORS_ENABLE=false để tắt). Nếu đặt CORS_ORIGINS thì chỉ cho phép các origin đó.
  const corsShouldEnable = process.env.CORS_ENABLE !== 'false';
  if (corsShouldEnable) {
    const allowlist = (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const useWildcard = allowlist.length === 0;
    app.enableCors({
      origin: useWildcard ? true : allowlist,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: false, // không cần cookies => có thể dùng wildcard
    });
    console.log('[CORS]', useWildcard ? 'Enabled for all origins' : 'Allowlist:', allowlist);
  } else {
    console.log('[CORS] Disabled');
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