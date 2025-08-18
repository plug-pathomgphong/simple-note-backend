import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

export interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async hashPassword(plain: string): Promise<string> {
    const salt = process.env.PASSWORD_SALT ?? 'dev_salt_change_me';
    return crypto.pbkdf2Sync(plain, salt, 10000, 64, 'sha512').toString('hex');
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const hash = await this.hashPassword(password);
    if (hash !== user.passwordHash) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async login(userId: number, email: string) {
    const payload: JwtPayload = { sub: userId, email };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async register(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await this.hashPassword(password);
    const created = await this.prisma.user.create({
      data: { email, passwordHash },
    });
    return this.login(created.id, created.email);
  }

  async verifyJwt(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException();
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
