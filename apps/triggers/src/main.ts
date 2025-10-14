import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const globalPrefix = 'v1';
  app.setGlobalPrefix(globalPrefix);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  
  const config = new DocumentBuilder()
    .setTitle('Rahat Triggers')
    .setDescription('The Rahat Triggers API description')
    .setVersion('1.0')
    .addTag('Triggers')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, documentFactory);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
  console.log(`📚 Swagger documentation is available at: http://localhost:${port}/api`);
}
bootstrap();
