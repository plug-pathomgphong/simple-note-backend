import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

describe('NotesController', () => {
  let controller: NotesController;
  let service: NotesService;

  const mockNotesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [NotesService, { provide: NotesService, useValue: mockNotesService }],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    service = module.get<NotesService>(NotesService);
    jest.clearAllMocks(); // Clear mock calls before each test
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('should call notesService.create with dto and file', async () => {
      const dto: CreateNoteDto = { title: 'Test', content: 'Hello' };
      const file = {
        originalname: 'file.txt',
        buffer: Buffer.from('test'),
        mimetype: 'text/plain',
      } as Express.Multer.File;

      mockNotesService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create(dto, file);
      expect(service.create).toHaveBeenCalledWith(dto, file);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('findAll()', () => {
    it('should call findAll with provided pagination dto', async () => {
      mockNotesService.findAll.mockResolvedValue({ items: [], meta: {} });

      const result = await controller.findAll({ page: 1, limit: 10 });
      expect(service.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual({ items: [], meta: {} });
    });
  });

  describe('findOne()', () => {
    it('should call findOne with id', async () => {
      mockNotesService.findOne.mockResolvedValue({ id: 1 });

      const result = await controller.findOne('1');
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('update()', () => {
    it('should call update with id, dto, and file', async () => {
      const dto: UpdateNoteDto = { title: 'Updated', content: 'Updated content' };
      const file = {
        originalname: 'update.txt',
        buffer: Buffer.from('update'),
        mimetype: 'text/plain',
      } as Express.Multer.File;

      mockNotesService.update.mockResolvedValue({ id: 1 });

      const result = await controller.update('1', dto, file);
      expect(service.update).toHaveBeenCalledWith(1, dto, file);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('remove()', () => {
    it('should call remove with id', async () => {
      mockNotesService.remove.mockResolvedValue({ id: 1 });

      const result = await controller.remove('1');
      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });
});
