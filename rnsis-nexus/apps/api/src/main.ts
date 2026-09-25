import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { env } from './config/env';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true, bufferLogs: true });
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com', 'https://js.stripe.com'],
          frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com', 'https://js.stripe.com'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", 'https://lumberjack.razorpay.com', 'https://api.razorpay.com'],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.useBodyParser('json', { limit: '2mb' });
  app.enableCors({
    origin: env.CORS_ORIGINS.split(',').map((s) => s.trim()),
    credentials: true,
    exposedHeaders: ['Content-Disposition', 'x-request-id'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.enableShutdownHooks();
  if (env.SWAGGER_ENABLED) setupSwagger(app);
  await app.listen(env.PORT, '0.0.0.0');
  Logger.log(`RNSIS Nexus API listening on :${env.PORT} (docs: ${env.API_URL}/api/docs)`, 'Bootstrap');
}

void bootstrap();
