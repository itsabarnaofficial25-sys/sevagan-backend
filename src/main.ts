import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  let port: number = parseInt(process.env.PORT || '3000', 10);

  // Enable CORS
  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? (process.env.ALLOWED_ORIGINS || '').split(',')
      : ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix(process.env.API_PREFIX || 'api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Sevagan API')
    .setDescription('Hyperlocal services platform API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth')
    .addTag('customers')
    .addTag('technicians')
    .addTag('jobs')
    .addTag('payments')
    .addTag('admin')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  try {
    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 Sevagan API running at http://localhost:${port}`);
    logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      logger.error(`❌ Port ${port} already in use`);
      const fallbackPort = port + 1;
      logger.warn(`🔁 Trying fallback port ${fallbackPort}...`);
      await app.listen(fallbackPort);
      logger.log(`🚀 Sevagan API running at http://localhost:${fallbackPort}`);
      logger.log(`📚 Swagger docs: http://localhost:${fallbackPort}/api/docs`);
    } else {
      throw error;
    }
  }
}

bootstrap();