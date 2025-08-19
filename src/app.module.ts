import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotesModule } from './notes/notes.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { S3Module } from './s3/s3.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    NotesModule,
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
    }),
    PrismaModule,
    S3Module,
    AuthModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100
      }
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, { provide: 'APP_GUARD', useClass: ThrottlerGuard }],
})
export class AppModule {}
