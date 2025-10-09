import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Rahat Triggers')
    .setDescription('The Rahat Triggers API description')
    .setVersion('1.0')
    .addTag('Triggers')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);

  console.log(
    `Swagger is running on port http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}
bootstrap();
