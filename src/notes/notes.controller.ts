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
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PaginationDto } from './dto/pagination.dto';
import { memoryStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { TimeoutInterceptor } from '../common/interceptors/timeout.interceptor';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @UseInterceptors(new TimeoutInterceptor(3000))
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  create(
    @Body() createNoteDto: CreateNoteDto,
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
  ) {
    return this.notesService.create(createNoteDto, file);
  }

  @Get()
  @UseInterceptors(new TimeoutInterceptor(3000))
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.notesService.findAll(paginationDto.page, paginationDto.limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notesService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(new TimeoutInterceptor(10000))
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
  ) {
    return this.notesService.update(+id, updateNoteDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notesService.remove(+id);
  }
}
