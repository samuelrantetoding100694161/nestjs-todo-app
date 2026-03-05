import { Action, User } from "@prisma/client";
import { Roles as newRole } from "../entities/roles.entity";

export abstract class RoleContract {
    abstract createRole(roleName: string, description: string, boxColor: string, roleColor:string): Promise<newRole>;
    abstract assignRoleToUser(userId: number, roleId: number): Promise<User> ;
    abstract getUserRoles(userId: number): Promise<string[]>; // Returns an array with one role name
    abstract removeRoleFromUser(userId: number): Promise<{ id: number; roleId: number | null }>;
    abstract updateUserRole(userId: number, newRoleId: number): Promise<User>;
    abstract updateRoleColor(roleId: number, boxColor: string, roleColor: string): Promise<newRole>
    abstract updateRolePermissions(roleId: number, actions: string[]): Promise<{ message: string }>;
    abstract removeRolePermissions(roleId: number, actionsToRemove: Action[]): Promise<{ message: string }>;
    abstract deleteRole(roleId: number): Promise<{ message: string }>;


  }
  