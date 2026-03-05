import { Prisma, Role, Status } from "@prisma/client";
import { User } from "../entities/user.entity";
import { PaginationResult } from "../entities/pagination.entity";

export abstract class UserRepoContract {
    abstract create(
        email: string,
        name: string,
        password: string,
        roles: string, //Accepts "roles" instead of "role"
        status: Status
    ): Promise<Omit<User, 'role'> & { roles: string }> 
    abstract findbyEmail(email: string): Promise<any>;
    abstract findbyId(id: number): Promise<any>;
    abstract findStatus(id: number): Promise<any>;
    abstract findbyUsername(name: string): Promise<any>;
    abstract update(id: number, body:Prisma.UserUpdateInput): Promise<{ 
        id: number; 
        name: string; 
        email: string; 
        status: Status; 
        roleName: string; 
    }>;
    abstract updateData(email: string, body: Prisma.UserUpdateInput): Promise<{ id: number; email: string; name: string; roleName: string; status?: Status }>;
    abstract delete(id: number): Promise<any>;
    abstract getAllUser(): Promise<Partial<User>[]>;
    abstract getUserbyId(userId: number): Promise<Partial<User> | null>;
    abstract findAllPaginated(page: number, pageSize: number, filters?: any): Promise<PaginationResult<any>> 
}