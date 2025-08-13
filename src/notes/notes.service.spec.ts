import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';

describe('NotesService', () => {
  let service: NotesService;
  let prisma: PrismaService;
  let s3: S3Service;

  const mockPrisma = {
    note: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockS3 = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: S3Service, useValue: mockS3 },],
    }).compile();

    service = module.get<NotesService>(NotesService);
    prisma = module.get<PrismaService>(PrismaService);
    s3 = module.get<S3Service>(S3Service);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  
  describe('create()', () => {
    it('should create note with file', async () => {
      const mockFile = {
        originalname: 'file.txt',
        buffer: Buffer.from('test'),
        mimetype: 'text/plain',
      } as Express.Multer.File;

      mockS3.uploadFile.mockResolvedValue('https://s3-url/file.txt');
      mockPrisma.note.create.mockResolvedValue({ id: 1, title: 'Note', attachmentUrl: 'https://s3-url/file.txt' });

      const result = await service.create({ title: 'Note', content: 'Test' }, mockFile);

      expect(s3.uploadFile).toHaveBeenCalled();
      expect(prisma.note.create).toHaveBeenCalledWith({
        data: {
          title: 'Note',
          content: 'Test',
          attachmentUrl: 'https://s3-url/file.txt',
        },
      });
      expect(result).toEqual({ id: 1, title: 'Note', attachmentUrl: 'https://s3-url/file.txt' });
    });

    it('should create note without file', async () => {
      mockPrisma.note.create.mockResolvedValue({ id: 2, title: 'Note 2', attachmentUrl: null });

      const result = await service.create({ title: 'Note 2', content: 'No File' });

      expect(s3.uploadFile).not.toHaveBeenCalled();
      expect(prisma.note.create).toHaveBeenCalledWith({
        data: {
          title: 'Note 2',
          content: 'No File',
          attachmentUrl: null,
        },
      });
    });
  });


  describe('findAll()', () => {
    it('should return paginated notes with extended meta', async () => {
      mockPrisma.$transaction.mockResolvedValue([3, [{ id: 1 }, { id: 2 }]]);

      const result = await service.findAll(1, 2);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        items: [{ id: 1 }, { id: 2 }],
        meta: {
          page: 1,
          limit: 2,
          totalItems: 3,
          totalPages: 2,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      });
    });

    it('should return empty paginated response when no items', async () => {
      mockPrisma.$transaction.mockResolvedValue([0, []]);
      const result = await service.findAll(1, 5);
      expect(result).toEqual({
        items: [],
        meta: {
          page: 1,
          limit: 5,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    });

    it('should throw InvalidPageException if page is out of range', async () => {
      mockPrisma.$transaction.mockResolvedValue([10, Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }))]);
      await expect(service.findAll(5, 3)).rejects.toThrow('Page number exceeds total items');
    });
  });

  describe('update()', () => {
    it('should update note with new file and delete old', async () => {
      const oldNote = {
        id: 1,
        title: 'Old',
        content: 'Content',
        attachmentUrl: 'https://s3.amazonaws.com/uploads/oldfile.txt',
      };
      const newFile = {
        originalname: 'new.txt',
        buffer: Buffer.from('new file'),
        mimetype: 'text/plain',
      } as Express.Multer.File;

      mockPrisma.note.findUnique.mockResolvedValue(oldNote);
      mockS3.deleteFile.mockResolvedValue(undefined);
      mockS3.uploadFile.mockResolvedValue('https://s3-url/newfile.txt');
      mockPrisma.note.update.mockResolvedValue({ ...oldNote, attachmentUrl: 'https://s3-url/newfile.txt' });

      const result = await service.update(1, { title: 'Updated', content: 'New' }, newFile);

      expect(mockS3.deleteFile).toHaveBeenCalledWith('uploads/oldfile.txt');
      expect(mockS3.uploadFile).toHaveBeenCalled();
      expect(result.attachmentUrl).toBe('https://s3-url/newfile.txt');
    });
  });

   describe('remove()', () => {
    it('should delete file and note', async () => {
      const note = {
        id: 1,
        attachmentUrl: 'https://s3.amazonaws.com/uploads/file.txt',
      };
      mockPrisma.note.findUnique.mockResolvedValue(note);
      mockS3.deleteFile.mockResolvedValue(undefined);
      mockPrisma.note.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(mockS3.deleteFile).toHaveBeenCalledWith('uploads/file.txt');
      expect(mockPrisma.note.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1 });
    });

    it('should throw if note not found', async () => {
      mockPrisma.note.findUnique.mockResolvedValue(null);
      await expect(service.remove(1)).rejects.toThrow('Note with id 1 not found');
    });
  });
});
