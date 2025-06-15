import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotesModule } from './notes/notes.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [NotesModule, ConfigModule.forRoot({
    isGlobal: true, // Makes the configuration available globally
    envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`, // Loads environment variables from a specific file based on NODE_ENV
    ignoreEnvFile: process.env.NODE_ENV === 'production',
  }), PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
