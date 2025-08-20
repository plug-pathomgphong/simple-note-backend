import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotesModule } from './notes/notes.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { S3Module } from './s3/s3.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true, // Makes the cache available globally
      ttl: 5000, // Time to live in seconds
      max: 100, // Maximum number of items in the cache
    }),
    NotesModule,
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
    }),
    PrismaModule,
    S3Module,
    AuthModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60 * 1000, // 60 seconds in milliseconds
        limit: 100,
      }
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    { provide: 'APP_GUARD', useClass: ThrottlerGuard }, // Global Throttler Guard
    { provide: 'APP_INTERCEPTOR', useClass: CacheInterceptor }, // Global Cache Manager
  ],
})
export class AppModule {}
