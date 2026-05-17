import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  const envFrontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3010',
    ...(envFrontendUrl ? [envFrontendUrl] : []),
  ]);
  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser clients (no origin) and local dev ports.
      if (!origin || /^https?:\/\/localhost:\d+$/i.test(origin) || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.setGlobalPrefix('super-admin');
  await app.listen(process.env.PORT || 3001);
}
bootstrap();
