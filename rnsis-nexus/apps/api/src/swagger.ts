import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function buildOpenApi(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('RNSIS Nexus API')
    .setDescription(
      'School Management & Fee Tracking System for RNSIS International School.\n\n' +
        'All amounts are integer **paise** (₹1 = 100). Dates are ISO-8601; calendar dates (due dates, DOB) are UTC midnight.\n\n' +
        'Authenticate with `POST /api/auth/login`, then send `Authorization: Bearer <accessToken>`. Every route enforces RBAC permissions.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication) {
  SwaggerModule.setup('api/docs', app, buildOpenApi(app), { swaggerOptions: { persistAuthorization: true, docExpansion: 'none', tagsSorter: 'alpha' } });
}
