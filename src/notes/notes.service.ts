import { Injectable } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  private notes = [
    { id: 1, title: 'Note 1', content: 'Content 1' },
    { id: 2, title: 'Note 2', content: 'Content 2' },
  ]
  create(createNoteDto: CreateNoteDto) {
    const newNote = {
      id: this.notes.length + 1,
      title: createNoteDto.title,
      content: createNoteDto.content,
    };
    this.notes.push(newNote);
    return newNote;
  }

  findAll() {
    return this.notes;
  }

  findOne(id: number) {
    const note = this.notes.find(note => note.id === id);
    if (!note) {
      throw new Error(`Note with id ${id} not found`);
    }
    return note;
  }

  update(id: number, updateNoteDto: UpdateNoteDto) {
    const noteIndex = this.notes.findIndex(note => note.id === id);
    if (noteIndex === -1) {
      throw new Error(`Note with id ${id} not found`);
    }
    this.notes[noteIndex] = { ...this.notes[noteIndex], ...updateNoteDto };
    return this.notes[noteIndex];
  }

  remove(id: number) {
    const noteIndex = this.notes.findIndex(note => note.id === id);
    if (noteIndex === -1) {
      throw new Error(`Note with id ${id} not found`);
    }
    this.notes.splice(noteIndex, 1);
    return `Note with id ${id} removed successfully`;
  }
}
