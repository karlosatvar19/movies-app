import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './infrastructure/http/filters/http-exception.filter';

/**
 * Bootstrap the NestJS application with necessary configurations
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Apply global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable CORS
  app.enableCors();

  // Set up Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Space Movies API')
    .setDescription('API for fetching and managing space-themed movies')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start the server
  await app.listen(process.env.PORT || 3000);
}

bootstrap();
