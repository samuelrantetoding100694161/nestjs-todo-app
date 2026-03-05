import { Controller, Post, Get, Param, Body, NotFoundException, Patch, Delete, UseGuards, Put, BadRequestException, Query, Req, ForbiddenException } from '@nestjs/common';
import { RoleService } from './roles.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePermissionDTO } from './dto/create-permissions.dto';
import { Action, Prisma } from '@prisma/client';
import { error } from 'console';
import { AuthGuard } from 'src/auth/auth-guards';
import { PermissionsGuard } from './permissions.guard';
import { Action as PermissionAction } from 'src/roles/permissions.decorator';
import { PaginationResult } from './entities/paginationrole.entity';

@Controller('roles')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly prisma: PrismaService
  ) {}
  // Create a new role
  @Post()
  @UseGuards(AuthGuard, PermissionsGuard)
  @PermissionAction('ADD_ROLES')
  async createRole(@Body() { roleName, description, boxColor, roleColor }: { roleName: string; description: string; boxColor: string; roleColor:string }) {
    return this.roleService.createRole(roleName, description, boxColor, roleColor);
  }

  @Patch(':id/color')
  @UseGuards(AuthGuard, PermissionsGuard)
  @PermissionAction('UPDATE_ROLESCOLOR') // Change this permission if needed
  async updateRoleColor(@Param('id') id: string, @Body() body: { boxColor: string , roleColor: string}) {
    const roleId = parseInt(id, 10);
    if (isNaN(roleId)) throw new BadRequestException('Invalid role ID');
    if (!/^#[0-9A-F]{6}$/i.test(body.boxColor)) throw new BadRequestException('Invalid hex color for box color');
    if (!/^#[0-9A-F]{6}$/i.test(body.roleColor)) throw new BadRequestException('Invalid hex color for role color');


    return this.roleService.updateRoleColor(roleId, body.boxColor, body.roleColor);
  }

  // Assign a role to a user
  @Post('assign/:userId/:roleId')
  async assignRole(@Param('userId') userId: number, @Param('roleId') roleId: number) {//not needed
    return this.roleService.assignRoleToUser(Number(userId), Number(roleId));
  }

  // Get all roles of a user
  @Get('user/:userId')
  async getUserRoles(@Param('userId') userId: number) {//not needed
    return this.roleService.getUserRoles(Number(userId));
  }

  // Remove a role from a user
  @Delete('user/:userId')
  async removeRole(@Param('userId') userId: number,) {//not needed
    return this.roleService.removeRoleFromUser(Number(userId));
  }

  // Update a user's role
  @Post('update/:userId/:newRoleId')
  async updateUserRole(@Param('userId') userId: number, @Param('newRoleId') newRoleId: number) {//not needed
    return this.roleService.updateUserRole(Number(userId), Number(newRoleId));
  }

  @Post('permissions/add')
  async addPermission(@Body() data: CreatePermissionDTO) {
    const role = await this.prisma.role.findUnique({
      where: { roleName: data.roleName },
    });

    if (!role) {
      throw new NotFoundException(`Role '${data.roleName}' not found`);
    }

    const newPermission = await this.prisma.rolePermission.create({
      data: {
        roleId: role.id,
        action: data.action as Action, // Uses ENUM for strict validation
      },
    });

    return { message: 'Permission added successfully', newPermission };
  }

@Get()
@UseGuards(AuthGuard, PermissionsGuard)
@PermissionAction('GET_ALLROLES')
async getAllRoles(
  @Query('page') page: string,
  @Query('pageSize') pageSize: string
): Promise<PaginationResult<any>> {
  const pageNumber = parseInt(page, 10) || 1;
  const pageSizeNumber = parseInt(pageSize, 10) || 5;

  const [roles, total] = await Promise.all([
    this.prisma.role.findMany({
      skip: (pageNumber - 1) * pageSizeNumber,
      take: pageSizeNumber,
      include: {
        RolePermission: true, // Fetch associated roles along with permissions
      },
    }),
    this.prisma.role.count() // Get total count of roles
  ]);

  return new PaginationResult(roles, total, pageNumber, pageSizeNumber);
}


  @Get('get-permissions')
  @UseGuards(AuthGuard, PermissionsGuard)
  @PermissionAction('GET_ALLPERMISSIONS')
  async getAllPermissions() {
    return this.prisma.rolePermission.findMany(); // Fetch all roles
  }

 
 @Get('get-userrole')
  @UseGuards(AuthGuard)
  //@PermissionAction('GET_ALLROLES')
  async getUserSearchRoles() {//apply pagination
    return this.prisma.role.findMany({
      include: {
        RolePermission: true, // Fetch associated roles along with permissions
      },
    }); // Fetch all roles
  } 

  @Get(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @PermissionAction('GET_ROLES')
  async getRoles(@Param('id') id: string,){
    const roleId = parseInt(id, 10);
    if(isNaN(roleId)){
      throw new BadRequestException("Invalid role ID");
    }
    return this.prisma.role.findUnique({where: { id: roleId },});
  }

  @Get('permissions/:id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @PermissionAction('GET_PERMISSIONS')
  async getRolePermissions(@Param('id') id: string) {
    const roleId = parseInt(id, 10);
    if(isNaN(roleId)){
      throw new BadRequestException("Invalid role ID");
    }

    const rolePermission = await this.prisma.role.findUnique({
      where: {id:roleId},
      include: {
        RolePermission : true // Fetch associated permissions
      }
    });
    if (!rolePermission) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }
    console.log(`Permission for id ${roleId}`)
    return  rolePermission.RolePermission.map((rp) => rp.action);;
  }

  @Patch('permissions/:id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @PermissionAction('UPDATE_PERMISSIONS')
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() body: { actions: Action[] } , @Req() req
  ) {
    const roleId = parseInt(id, 10);
    const user = req.user;
    console.log("user: ", user);
    console.log(id);
    if (isNaN(roleId)) {
      throw new BadRequestException("Invalid role ID");
    }
    if (user.roles === 'Owner' && roleId === 1) {
      throw new ForbiddenException("Owners cannot update their own permissions");
    }
    if (roleId === 1) {
      throw new ForbiddenException("Owner permissions cannot be modified");
    }
    const updateRole = await this.roleService.updateRolePermissions(roleId, body.actions)
    console.log("permissions updated succesfully");
    if (!updateRole) {
      throw new NotFoundException("Role not found or update failed");
    }

    return updateRole;
  }

  @Patch(':id/permissions/remove')
  async removeRolePermissions(
    @Param('id') id: string,
    @Body() body: { actions: Action[] } // Allow removing multiple actions at once
  ) {//not needed
  const roleId = parseInt(id, 10);
    if (isNaN(roleId)) {
      throw new BadRequestException("Invalid role ID");
    }
    return this.roleService.removeRolePermissions(roleId, body.actions)
  }

  @Delete(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @PermissionAction('DELETE_ROLES')
  async deleteRole(@Param('id') id: string,){
    const roleId = parseInt(id, 10);
    if(isNaN(roleId)){
      throw new BadRequestException("Invalid role ID");
    }
    return this.roleService.deleteRole(roleId);
  }

}


