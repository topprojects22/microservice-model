import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as promBundle from 'express-prom-bundle';
import { PrismaService } from './prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Metrics
  const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
  });
  app.use(metricsMiddleware);

  // Swagger
  const config = new DocumentBuilder()
      .setTitle('NN Weights Service')
      .setDescription('API for neural network weights management')
      .addBearerAuth()
      .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Validation
  app.useGlobalPipes(new ValidationPipe());

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  await app.listen(3100);
}
bootstrap();
