import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { UserRepository } from './user.repository';
import { RolesGuard } from 'src/roles/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from 'src/auth/auth.module';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [JwtModule.register({
    global: true,
    secret: process.env.JWT_SECRET
  }), AuthModule, RolesModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, AuthService, UserRepository],
  exports: [AuthService, UserRepository]
})
export class UserModule {}
