import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';
import { Action } from '@prisma/client';
import { error } from 'console';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAction = this.reflector.get<Action>('action', context.getHandler());
    if (!requiredAction) {
      return true; // If no action is required, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('User roles not found in token');
    }

    // Fetch permissions for user's roles dynamically
    const permissions = await this.prisma.rolePermission.findMany({
      where: { role: { roleName: { in: [user.roles] } } },
      select: { action: true },
    });
    

    const userActions = permissions.map((p) => p.action);

    console.log('User Role: ', user.roles);
    console.log('Required Action:', requiredAction);
    console.log(`Permissions for ${user.roles}:`, permissions);
    console.log('User Action allowed:', userActions);

    if (!userActions.includes(requiredAction)) {
      console.log('error action');
      throw new ForbiddenException(`Access denied for action: ${requiredAction}`);
    }

    return true;
  }
}
