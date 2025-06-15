import { Injectable } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {

  constructor(private prisma: PrismaService) {}
  create(data: CreateNoteDto) {
    return this.prisma.note.create({ data });
  }

  findAll() {
    return this.prisma.note.findMany();
  }

  findOne(id: number) {
    const note = this.prisma.note.findUnique({
      where: { id },
    });
    if (!note) {
      throw new Error(`Note with id ${id} not found`);
    }
    return note;
  }

  update(id: number, data: UpdateNoteDto) {
    const note = this.prisma.note.update({
      where: { id },
      data,
    });
    if (!note) {
      throw new Error(`Note with id ${id} not found`);
    }
    return note;
  }

  remove(id: number) {
    const note = this.prisma.note.delete({
      where: { id },
    });
    if (!note) {
      throw new Error(`Note with id ${id} not found`);
    }
    return note;
  }
}
