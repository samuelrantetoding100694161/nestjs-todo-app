import { Module } from '@nestjs/common';
import { RolesGuard } from '../roles/roles.guard';
import { RoleService } from './roles.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { PermissionsGuard } from './permissions.guard';

@Module({
  imports: [PrismaModule],
  providers: [RoleService, RolesGuard, PermissionsGuard, PrismaService],
  exports: [RoleService],
})
export class RolesModule {}
