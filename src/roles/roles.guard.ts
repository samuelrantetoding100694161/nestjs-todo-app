import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true; // If no roles are required, allow access

    const request = context.switchToHttp().getRequest();
    const user = request.user; // User should be set by the AuthGuard

    if (!user) throw new ForbiddenException('User not authenticated');

    // Fetch user roles from the UserRole table
    const userWithRole = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true }, // Get the role details from the Role model
    });

    if (!userWithRole || !userWithRole.role ) throw new ForbiddenException('User not found');

    // Extract role names from the userRoles array
    const userRoleName = userWithRole.role.roleName;

    console.log('Required Roles:', requiredRoles);
    console.log('User Roles:', userRoleName);

    // Check if the user has at least one required role
    const hasRequiredRole = requiredRoles.includes(userRoleName);

    if (!hasRequiredRole) throw new ForbiddenException('Access denied: Insufficient permissions');

    return true;
  }
}
