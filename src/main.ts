import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  //app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3001);//port 3001

}
bootstrap();
