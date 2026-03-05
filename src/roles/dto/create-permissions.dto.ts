import { Action, Prisma } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

// export enum Action {
//   CREATE_USER = 'CREATE_USER',
//   GETALL_USER = 'GETALL_USER',
//   GET_USER = 'GET_USER',
//   UPDATE_USERSTATUS = 'UPDATE_USERSTATUS',
//   UPDATE_USERSDATA = 'UPDATE_USERDATA',
//   DELETE_USER = 'DELETE_USER',
//   ADD_ROLES = 'ADD_ROLES',
//   DELETE_ROLES = 'DELETE_ROLES'
// }

export class CreatePermissionDTO {
  @IsString()
  roleName: string;

  @IsEnum(Action, { message: 'Invalid action. Must be a valid enum value.' }) //Use Prisma Enum
  action: Action;
}
