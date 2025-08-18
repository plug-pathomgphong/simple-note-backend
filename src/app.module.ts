import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotesModule } from './notes/notes.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { S3Module } from './s3/s3.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    NotesModule,
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
    }),
    PrismaModule,
    S3Module,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
