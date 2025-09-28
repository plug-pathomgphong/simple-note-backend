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
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PaginationDto } from './dto/pagination.dto';
import { memoryStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { TimeoutInterceptor } from '../common/interceptors/timeout.interceptor';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(new TimeoutInterceptor(3000))
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  create(
    @Body() createNoteDto: CreateNoteDto,
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @Req() req: { user: { id: number } },
  ) {
    // Assuming req.user contains the user object with id
    return this.notesService.create(createNoteDto, req.user.id, file);
  }

  @Post('search')
  async search(@Body() searchDto: { query: string; limit?: number }) {
    return await this.notesService.searchNotes(
      searchDto.query,
      searchDto.limit,
    );
  }

  @Get()
  @CacheKey('all-notes') // Custom cache key for this endpoint
  @CacheTTL(10000) // Cache this endpoint for 60 seconds
  @UseInterceptors(new TimeoutInterceptor(3000))
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.notesService.findAll(paginationDto.page, paginationDto.limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(new TimeoutInterceptor(10000))
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @Req() req: { user: { id: number } },
  ) {
    return this.notesService.update(+id, updateNoteDto, req.user.id, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: { user: { id: number } }) {
    return this.notesService.remove(+id, req.user.id);
  }
}
