import { Injectable } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}
  async create(data: CreateNoteDto, file?: Express.Multer.File) {
    let attachmentUrl: string | null = null;
    if (file) {
      const fileName = `uploads/${Date.now()}-${file.originalname}`;
      attachmentUrl = await this.s3Service.uploadFile(
        file.buffer,
        fileName,
        file.mimetype,
      );
    }
    return this.prisma.note.create({ data: { ...data, attachmentUrl } });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [totalItems, items] = await this.prisma.$transaction([
      this.prisma.note.count(),
      this.prisma.note.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    if (totalItems === 0) {
      return [];
    }
    if (skip >= totalItems) {
      throw new Error('Page number exceeds total items');
    }

    const totalPages = Math.ceil(totalItems / limit);
    return {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  async findOne(id: number) {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });
    if (!note) {
      throw new Error(`Note with id ${id} not found`);
    }
    return note;
  }

  async update(id: number, data: UpdateNoteDto, file?: Express.Multer.File) {
    const existingNote = await this.prisma.note.findUnique({
      where: { id },
    });
    if (!existingNote) {
      throw new Error(`Note with id ${id} not found`);
    }

    let attachmentUrl = existingNote.attachmentUrl;
    if (file) {
      if (existingNote.attachmentUrl) {
        // If the note already has an attachment, delete it from S3
        const fileName = existingNote.attachmentUrl.split('/').pop();
        await this.s3Service.deleteFile(`uploads/${fileName}`);
      }

      // If a new file is provided, upload it to S3
      const fileName = `uploads/${Date.now()}-${file.originalname}`;
      attachmentUrl = await this.s3Service.uploadFile(
        file.buffer,
        fileName,
        file.mimetype,
      );
    }

    const note = await this.prisma.note.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        attachmentUrl,
      },
    });
    if (!note) {
      throw new Error(`Note with id ${id} not found`);
    }
    return note;
  }

  async remove(id: number) {
    // Ensure the note exists before attempting to delete
    const existingNote = await this.prisma.note.findUnique({
      where: { id },
    });
    if (!existingNote) {
      throw new Error(`Note with id ${id} not found`);
    }

    // delete the file from S3 if it exists
    if (existingNote.attachmentUrl) {
      const fileName = existingNote.attachmentUrl.split('/').pop();
      await this.s3Service.deleteFile(`uploads/${fileName}`);
    }

    // Delete the note
    // Note: The Prisma client does not return the deleted record by default.

    return this.prisma.note.delete({ where: { id } });
  }
}
