import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { httpRequestsTotal, normalizeRoute } from './metrics/metrics';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Métricas HTTP (Prometheus): conta requests por método/rota/status_code.
  // Usa res.on('finish') para capturar também respostas 404/500.
  app.use((req, res, next) => {
    // Evitar “auto-métrica” do próprio endpoint de métricas
    if (req.path === '/metrics') return next();

    res.on('finish', () => {
      const method = (req.method || 'UNKNOWN').toUpperCase();
      const status = String(res.statusCode ?? 0);

      // Para rotas encontradas pelo Express, req.route.path existe e mantém baixa cardinalidade.
      // Para 404, req.route não existe; caímos para req.path.
      const routeFromExpress =
        (req as any).route?.path && (req as any).baseUrl
          ? `${(req as any).baseUrl}${(req as any).route.path}`
          : (req as any).route?.path;
      const route = normalizeRoute(routeFromExpress || req.path || 'unknown');

      httpRequestsTotal.inc({ method, route, status_code: status });
    });

    next();
  });

  // Configuração de CORS
  app.enableCors({
    origin: [
      'http://localhost:3001', // Frontend local
      'http://localhost:3000', // Swagger local
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
    ],
    credentials: true,
  });

  // Configuração global de validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('MedInventory API')
    .setDescription('API para gerenciamento de inventário médico')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Endpoints de autenticação')
    .addTag('users', 'Endpoints de usuários')
    .addTag('equipamentos', 'Endpoints de equipamentos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📚 Swagger documentation: http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}
void bootstrap();
