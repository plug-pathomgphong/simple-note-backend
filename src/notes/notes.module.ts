import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [PrismaModule, S3Module], // Importing S3Module to use S3Service
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
