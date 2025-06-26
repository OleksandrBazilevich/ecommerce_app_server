import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: this.config.get<string>('GMAIL_USER'),
        pass: this.config.get<string>('GMAIL_PASS'),
      },
    });
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
    const hash = await bcrypt.hash(dto.password, 10);
    const emailToken = randomBytes(32).toString('hex');
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
        isEmailConfirmed: false,
        emailConfirmationToken: emailToken,
      },
    });
    try {
      await this.transporter.sendMail({
        to: user.email,
        from: this.config.get<string>('GMAIL_USER'),
        subject: 'Email confirmation',
        html: `<p>To confirm your email, follow this <a href="${this.config.get<string>('FRONTEND_URL')}/confirm-email?token=${emailToken}">link</a></p>`,
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to send confirmation email',
      );
    }
    return { id: user.id, email: user.email, name: user.name };
  }

  async confirmEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailConfirmationToken: token },
    });
    if (!user) {
      throw new ConflictException('Invalid or expired confirmation token');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailConfirmed: true,
        emailConfirmationToken: null,
      },
    });
    return { message: 'Email confirmed successfully' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // If email is not confirmed, assign GUEST role
    const payload = user.isEmailConfirmed
      ? { sub: user.id, email: user.email, role: user.role }
      : { sub: user.id, email: user.email, role: 'GUEST' };
    const accessToken = jwt.sign(
      payload,
      this.config.getOrThrow<string>('JWT_SECRET'),
      { expiresIn: '15m' },
    );
    const refreshToken = jwt.sign(
      payload,
      this.config.getOrThrow<string>('JWT_SECRET'),
      { expiresIn: '7d' },
    );
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: payload.role,
        isEmailConfirmed: user.isEmailConfirmed,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: jwt.JwtPayload | string;
    try {
      payload = jwt.verify(
        refreshToken,
        this.config.getOrThrow<string>('JWT_SECRET'),
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: Number(payload.sub) },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // If email is not confirmed, always return GUEST role
    const newPayload = user.isEmailConfirmed
      ? { sub: user.id, email: user.email, role: user.role }
      : { sub: user.id, email: user.email, role: 'GUEST' };
    const accessToken = jwt.sign(
      newPayload,
      this.config.getOrThrow<string>('JWT_SECRET'),
      { expiresIn: '15m' },
    );
    const newRefreshToken = jwt.sign(
      newPayload,
      this.config.getOrThrow<string>('JWT_SECRET'),
      { expiresIn: '7d' },
    );
    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: newPayload.role,
        isEmailConfirmed: user.isEmailConfirmed,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return {
        message:
          'If this email exists, password reset instructions have been sent.',
      };
    }
    const resetToken = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordTokenExpires: new Date(Date.now() + 1000 * 60 * 60),
      },
    });
    try {
      await this.transporter.sendMail({
        to: user.email,
        from: this.config.get<string>('GMAIL_USER'),
        subject: 'Password reset',
        html: `<p>To reset your password, follow this <a href="${this.config.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}">link</a></p>`,
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to send password reset email',
      );
    }
    return {
      message:
        'If this email exists, password reset instructions have been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpires: { gt: new Date() },
      },
    });
    if (!user) {
      throw new ConflictException('Invalid or expired reset token');
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        resetPasswordToken: null,
        resetPasswordTokenExpires: null,
      },
    });
    return { message: 'Password has been reset successfully' };
  }
}
