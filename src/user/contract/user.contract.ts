import { Role, Status } from "@prisma/client";
import { CreateUserDTO } from "../dto/create-user-dto";
import { User } from "../entities/user.entity";
import { PaginationResult } from "../entities/pagination.entity";

export abstract class UserContract {
    abstract create(data: CreateUserDTO): Promise<{ message: string; user: User }>;
    abstract findbyEmail(email: string): Promise<{ id: number; name: string; email: string; status: string; role: string }>
    abstract findbyUsername(username: string): Promise<User | null>;
    abstract findbyId(id: number): Promise<any>;
    abstract delete(id: number): Promise<{ message: string; success: boolean }>;
    abstract getAllUser(): Promise<Partial<User>[]>;
    abstract updateActive(id: number): Promise<any>;
    abstract updateUser(email: string, data: Partial<CreateUserDTO>): Promise<{ 
        id: number; 
        email: string; 
        name: string; 
        password: string; 
        roles: string;  // Now returns roleName as a string
        status?: Status;
    }>;
    abstract getUsers(page: number, pageSize: number, filters?: any): Promise<PaginationResult<any>> 
    
}
