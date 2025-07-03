import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { memoryStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  create(
    @Body() createNoteDto: CreateNoteDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.notesService.create(createNoteDto, file);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.notesService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notesService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // console.log('updateNoteDto', id, updateNoteDto);
    // console.log('file', file);
    // await new Promise((resolve) => setTimeout(resolve, 5000));
    // return '';
    return this.notesService.update(+id, updateNoteDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notesService.remove(+id);
  }
}
