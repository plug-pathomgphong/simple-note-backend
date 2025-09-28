import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { PaginatedResponse } from './interfaces/paginated-response.interface';
import { Note } from './entities/note.entity';
import {
  NoteNotFoundException,
  InvalidPageException,
} from '../common/exceptions';
import axios from 'axios';

@Injectable()
export class NotesService {
  private readonly endpoint = 'http://localhost:8080/embed';

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await axios.post(this.endpoint, {
      inputs: text,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('Embedding API returned empty result');
    }
    return response.data[0];
  }

  async searchNotes(query: string, limit: number = 10): Promise<Note[]> {
    console.log('Searching for notes with query:', query);
    console.log('Generating embedding for limit:', limit);
    const embedding = await this.generateEmbedding(query);
    console.log('Embedding:', embedding);

    return this.prisma.$queryRawUnsafe<any[]>(
      `
      SELECT id, title, content, (1 - (embedding <=> $1::vector)) AS similarity
        FROM "Note"
        ORDER BY similarity DESC
        LIMIT $2;
      `,
      embedding,
      limit,
    );
  }

  async create(
    noteData: CreateNoteDto,
    userId: number,
    file?: Express.Multer.File,
  ) {
    const embedding = await this.generateEmbedding(noteData.content);

    let attachmentUrl: string | null = null;
    if (file) {
      const fileName = `uploads/${Date.now()}-${file.originalname}`;
      attachmentUrl = await this.s3Service.uploadFile(
        file.buffer,
        fileName,
        file.mimetype,
      );
    }
    console.log('Attachment URL:', attachmentUrl);

    const note = await this.prisma.$queryRawUnsafe(
      `
      INSERT INTO "Note" (title, content, attachment_url, user_id, embedding, "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, title, content, attachment_url, user_id;
      `,
      noteData.title,
      noteData.content,
      attachmentUrl,
      userId,
      embedding,
    );

    return note;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<Note>> {
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
      return {
        items: [],
        meta: {
          page,
          limit,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    if (skip >= totalItems) {
      throw new InvalidPageException(page, totalItems);
    }

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async findOne(id: number) {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });
    if (!note) {
      throw new NoteNotFoundException(id);
    }
    return note;
  }

  async update(
    id: number,
    data: UpdateNoteDto,
    userId: number,
    file?: Express.Multer.File,
  ) {
    const existingNote = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new NoteNotFoundException(id);
    }

    if (existingNote.userId !== userId) {
      throw new ForbiddenException('You are not allowed to update this note');
    }

    const embedding = await this.generateEmbedding(data.content as string);

    let attachmentUrl = existingNote.attachmentUrl;
    if (file) {
      if (existingNote.attachmentUrl) {
        const fileName = existingNote.attachmentUrl.split('/').pop();
        await this.s3Service.deleteFile(`uploads/${fileName}`);
      }

      const fileName = `uploads/${Date.now()}-${file.originalname}`;
      attachmentUrl = await this.s3Service.uploadFile(
        file.buffer,
        fileName,
        file.mimetype,
      );
    }

    const note = await this.prisma.$queryRawUnsafe<Note>(
      `
      UPDATE "Note"
      SET title = $1, content = $2, attachment_url = $3, embedding = $4
      WHERE id = $5
      RETURNING id, title, content, attachment_url, user_id;
      `,
      data.title,
      data.content,
      attachmentUrl,
      embedding,
      id,
    );

    return note;
  }

  async remove(id: number, userId: number) {
    const existingNote = await this.prisma.note.findUnique({
      where: { id },
    });
    if (!existingNote) {
      throw new NoteNotFoundException(id);
    }

    if (existingNote.userId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this note');
    }

    if (existingNote.attachmentUrl) {
      const fileName = existingNote.attachmentUrl.split('/').pop();
      await this.s3Service.deleteFile(`uploads/${fileName}`);
    }

    return this.prisma.note.delete({ where: { id } });
  }
}
