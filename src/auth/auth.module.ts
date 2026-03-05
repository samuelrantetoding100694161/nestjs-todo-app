import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth-guards';
import { UserRepository } from 'src/user/user.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from 'src/roles/roles.guard'; 
import { RoleService } from 'src/roles/roles.service';
import { RolesModule } from 'src/roles/roles.module';
import { PermissionsGuard } from 'src/roles/permissions.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30m' },
    }), RolesModule
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard, UserRepository, PrismaService, PermissionsGuard],
  exports: [AuthService, AuthGuard, RolesGuard]
})
export class AuthModule {}
