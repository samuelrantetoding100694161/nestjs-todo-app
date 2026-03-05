import { User } from "@prisma/client";
import { CreateAuthDTO, LoginDTO } from "../dto/create-auth-dto";
import { Auth } from "../entities/auth.entity";

export abstract class AuthContract {
    abstract register(register: CreateAuthDTO): Promise<{ message: string; token: Auth }>;
    abstract userValidation(validateUser: LoginDTO): Promise<{ message: string; token: Auth }>;
    abstract refreshToken(refreshToken: string): Promise<Auth>;
    abstract generateJwtToken(user: User, roleName: string): Promise<Auth>;
    abstract logout(refreshToken: string): Promise<void>;
    abstract getPermissionsByRole(role: string): Promise<string[]>
}
