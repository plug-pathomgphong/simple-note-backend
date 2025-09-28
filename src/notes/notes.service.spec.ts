import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NotesService', () => {
  let service: NotesService;

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
    $queryRawUnsafe: jest.fn(),
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
        { provide: S3Service, useValue: mockS3 },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    jest.clearAllMocks();

    // Mock axios response for embedding generation
    mockedAxios.post.mockResolvedValue({
      data: [[0.1, 0.2, 0.3, 0.4, 0.5]],
    });
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
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        {
          id: 1,
          title: 'Note',
          content: 'Test',
          attachment_url: 'https://s3-url/file.txt',
          user_id: 1,
        },
      ]);

      const result = await service.create(
        { title: 'Note', content: 'Test' },
        1,
        mockFile,
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8080/embed',
        {
          inputs: 'Test',
        },
      );
      expect(mockS3.uploadFile).toHaveBeenCalledWith(
        mockFile.buffer,
        expect.stringMatching(/uploads\/\d+-file\.txt/),
        'text/plain',
      );
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        'Note',
        'Test',
        'https://s3-url/file.txt',
        1,
        [0.1, 0.2, 0.3, 0.4, 0.5],
      );
      expect(result).toEqual([
        {
          id: 1,
          title: 'Note',
          content: 'Test',
          attachment_url: 'https://s3-url/file.txt',
          user_id: 1,
        },
      ]);
    });

    it('should create note without file', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        {
          id: 2,
          title: 'Note 2',
          content: 'No File',
          attachment_url: null,
          user_id: 1,
        },
      ]);

      const result = await service.create(
        {
          title: 'Note 2',
          content: 'No File',
        },
        1,
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8080/embed',
        {
          inputs: 'No File',
        },
      );
      expect(mockS3.uploadFile).not.toHaveBeenCalled();
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        'Note 2',
        'No File',
        null,
        1,
        [0.1, 0.2, 0.3, 0.4, 0.5],
      );
      expect(result).toEqual([
        {
          id: 2,
          title: 'Note 2',
          content: 'No File',
          attachment_url: null,
          user_id: 1,
        },
      ]);
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
      mockPrisma.$transaction.mockResolvedValue([
        10,
        Array.from({ length: 5 }, (_, i) => ({ id: i + 1 })),
      ]);
      await expect(service.findAll(5, 3)).rejects.toThrow(
        'Page number exceeds total items',
      );
    });
  });

  describe('searchNotes()', () => {
    it('should search notes with query and limit', async () => {
      const mockNotes = [
        { id: 1, title: 'Note 1', content: 'Content 1', similarity: 0.95 },
        { id: 2, title: 'Note 2', content: 'Content 2', similarity: 0.87 },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockNotes);

      const result = await service.searchNotes('test query', 5);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8080/embed',
        {
          inputs: 'test query',
        },
      );
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, title, content'),
        [0.1, 0.2, 0.3, 0.4, 0.5],
        5,
      );
      expect(result).toEqual(mockNotes);
    });

    it('should search notes with default limit', async () => {
      const mockNotes = [
        { id: 1, title: 'Note 1', content: 'Content 1', similarity: 0.95 },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockNotes);

      const result = await service.searchNotes('test query');

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, title, content'),
        [0.1, 0.2, 0.3, 0.4, 0.5],
        10, // Default limit
      );
      expect(result).toEqual(mockNotes);
    });

    it('should throw error if embedding API returns empty result', async () => {
      mockedAxios.post.mockResolvedValue({ data: [] });

      await expect(service.searchNotes('test query')).rejects.toThrow(
        'Embedding API returned empty result',
      );
    });
  });

  describe('findOne()', () => {
    it('should return note when found', async () => {
      const mockNote = { id: 1, title: 'Test Note', content: 'Test Content' };
      mockPrisma.note.findUnique.mockResolvedValue(mockNote);

      const result = await service.findOne(1);

      expect(mockPrisma.note.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockNote);
    });

    it('should throw NoteNotFoundException when note not found', async () => {
      mockPrisma.note.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(
        'Note with id 1 not found',
      );
    });
  });

  describe('update()', () => {
    it('should update note with new file and delete old', async () => {
      const oldNote = {
        id: 1,
        title: 'Old',
        content: 'Content',
        attachmentUrl: 'https://s3.amazonaws.com/uploads/oldfile.txt',
        userId: 1,
      };
      const newFile = {
        originalname: 'new.txt',
        buffer: Buffer.from('new file'),
        mimetype: 'text/plain',
      } as Express.Multer.File;

      mockPrisma.note.findUnique.mockResolvedValue(oldNote);
      mockS3.deleteFile.mockResolvedValue(undefined);
      mockS3.uploadFile.mockResolvedValue('https://s3-url/newfile.txt');
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        {
          id: 1,
          title: 'Updated',
          content: 'New',
          attachment_url: 'https://s3-url/newfile.txt',
          user_id: 1,
        },
      ]);

      const result = await service.update(
        1,
        { title: 'Updated', content: 'New' },
        1,
        newFile,
      );

      expect(mockPrisma.note.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockS3.deleteFile).toHaveBeenCalledWith('uploads/oldfile.txt');
      expect(mockS3.uploadFile).toHaveBeenCalledWith(
        newFile.buffer,
        expect.stringMatching(/uploads\/\d+-new\.txt/),
        'text/plain',
      );
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        'Updated',
        'New',
        'https://s3-url/newfile.txt',
        [0.1, 0.2, 0.3, 0.4, 0.5],
        1,
      );
      expect(result).toEqual([
        {
          id: 1,
          title: 'Updated',
          content: 'New',
          attachment_url: 'https://s3-url/newfile.txt',
          user_id: 1,
        },
      ]);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const oldNote = {
        id: 1,
        title: 'Old',
        content: 'Content',
        attachmentUrl: null,
        userId: 2, // Different user
      };

      mockPrisma.note.findUnique.mockResolvedValue(oldNote);

      await expect(
        service.update(1, { title: 'Updated', content: 'New' }, 1),
      ).rejects.toThrow('You are not allowed to update this note');
    });

    it('should throw NoteNotFoundException if note not found', async () => {
      mockPrisma.note.findUnique.mockResolvedValue(null);

      await expect(
        service.update(1, { title: 'Updated', content: 'New' }, 1),
      ).rejects.toThrow('Note with id 1 not found');
    });
  });

  describe('remove()', () => {
    it('should delete file and note', async () => {
      const note = {
        id: 1,
        attachmentUrl: 'https://s3.amazonaws.com/uploads/file.txt',
        userId: 1,
      };
      mockPrisma.note.findUnique.mockResolvedValue(note);
      mockS3.deleteFile.mockResolvedValue(undefined);
      mockPrisma.note.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1, 1);

      expect(mockPrisma.note.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockS3.deleteFile).toHaveBeenCalledWith('uploads/file.txt');
      expect(mockPrisma.note.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1 });
    });

    it('should throw if note not found', async () => {
      mockPrisma.note.findUnique.mockResolvedValue(null);
      await expect(service.remove(1, 1)).rejects.toThrow(
        'Note with id 1 not found',
      );
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const note = {
        id: 1,
        attachmentUrl: null,
        userId: 2, // Different user
      };
      mockPrisma.note.findUnique.mockResolvedValue(note);

      await expect(service.remove(1, 1)).rejects.toThrow(
        'You are not allowed to delete this note',
      );
    });
  });
});
