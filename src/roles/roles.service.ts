import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleContract } from './contract/roles.contract';
import { Action, User } from '@prisma/client';

@Injectable()
export class RoleService extends RoleContract{
  constructor(private prisma: PrismaService) {
    super();
  }

  async createRole(roleName: string, description: string, boxColor: string, roleColor:string) {
    const existingRole = await this.prisma.role.findUnique({
      where: { roleName: roleName }, 
  });
  
    if (existingRole) {
      console.log('role already exists');
      throw new BadRequestException('Role already exists');
    }
    const roles = await this.prisma.role.create({
      data: {
        roleName,
        description, 
        boxColor,
        roleColor,
      },
    });

    return roles;
  }

  async updateRoleColor(roleId: number, boxColor: string, roleColor: string) {
    return this.prisma.role.update({
      where: { id: roleId },
      data: { boxColor, roleColor },
    });
  }
  
  
  async assignRoleToUser(userId: number, roleId: number):Promise<User>{//not needed
    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { roleName: true }, // Fetch only roleName
    });

    if (!role) throw new Error('Role not found');

    // Assign the role using the UserRole table
    const updatedUser = await this.prisma.user.update({//not needed
      where: { id: userId },
      data: {
        roleId, // Update the roleId to assign the role
      },
    });
  
    return updatedUser;
  }

  //Get all roles assigned to a user
  async getUserRoles(userId: number) {//not needed
    // Fetch the user with their associated role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }, // Include the role details (roleName)
    });
  
    if (!user) {
      throw new Error('User not found');
    }
  
    // Return the roleName if the user has a role assigned
    return user.role ? [user.role.roleName] : []; // Return an array of role names (even if only one)
  }
  
  // Remove a specific role from a user
  async removeRoleFromUser(userId: number) {//not needed
    // Update the user's roleId to null (removes their role)
    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId: null }, // Set roleId to null
    });
  }
  

  //Update a user's role (removes old role & assigns new)
  async updateUserRole(userId: number, newRoleId: number):Promise<User> {//not needed
    // Check if the role exists
    const roleExists = await this.prisma.role.findUnique({
      where: { id: newRoleId },
    });
  
    if (!roleExists) {
      throw new Error('Role not found');
    }
  
    // Update the user's role by setting the new roleId
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { roleId: newRoleId }, // Set the new roleId for the user
    });
  
    return updatedUser;
  }

  async updateRolePermissions(roleId: number, actions: string[]) {
    // Convert actions from string[] to Action[]
    const validActions: Action[] = actions.map((action) => action as Action);

    // Delete existing permissions for the role
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Insert new permissions
    const newPermissions = validActions.map((action) => ({
      roleId,
      action, // Now it's correctly typed as Action enum
    }));

    await this.prisma.rolePermission.createMany({
      data: newPermissions,
    });

    return { message: "Permissions updated successfully" };
  }

  async removeRolePermissions(roleId: number, actionsToRemove: Action[]) {//remove specific permission
    // Find the role with its current permissions
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    
    });
  
    if (!role) {
      throw new NotFoundException("Role not found");
    }
  
    // Remove the specified actions
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId: roleId,
        action: { in: actionsToRemove }, // Delete only matching actions
      },
    });
  
    return { message: "Permissions removed successfully" };
  }

  async deleteRole(roleId: number) {
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });
  
    await this.prisma.role.delete({
      where: { id: roleId },
    });
  
    return { message: 'Role and its permissions deleted successfully' };
  }
  
  
}
