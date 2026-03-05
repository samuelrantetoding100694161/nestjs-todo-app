import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { Prisma, Role, Status } from '@prisma/client';
import { CreateUserDTO } from './dto/create-user-dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { NotEquals } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { decryptPassword } from 'src/common/utils/crypto.utils';
import { UserContract } from './contract/user.contract';
import { User } from './entities/user.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationResult } from './entities/pagination.entity';

@Injectable()
export class UserService extends UserContract {
    //prisma: any;
    constructor(
        private readonly userRepository: UserRepository,
        private readonly prisma: PrismaService,
        
    ){
        super();
    }
    
    async create(data: CreateUserDTO): Promise<{ message: string; user: User & { roles: string } }> {
        const { email, name, password, roles, status = Status.Active } = data;
        const roleData = await this.prisma.role.findUnique({
            where: { roleName: roles },
        });
        console.log(" Checking Role in DB:", roles);
        console.log("Role Found:", roleData);
        console.log('the received data: ', data);
        //console.log(" Received Data:", data); // Debugging
        console.log(" Assigned Status:", status); 
        console.log('email received: ', data.email);

        // Check if email is already registered
        const existingEmail = await this.userRepository.findbyEmail(email);
        console.log('the exist email:', existingEmail);
        if (existingEmail) {
            console.log('email exist');
            throw new BadRequestException('Email has already been registered!');
        }
        

        // Check if username already exists
        const existingUsername = await this.userRepository.findbyUsername(name);
        if (existingUsername) {
            throw new BadRequestException('Name has already been used!');
        }

       

        try {
            // Decrypt and hash the password
            const decryptedPassword = decryptPassword(password); // Decrypt AES
            if (!decryptedPassword) throw new BadRequestException('Invalid password decryption');
            
            const hashedPassword = await bcrypt.hash(decryptedPassword, 16);

            console.log("Adding user successful");

            // Use the repository method to create a user
            const newUser = await this.userRepository.create(email, name, hashedPassword, roles, status);

            return { message: "New user successfully added", user: newUser };
        } catch (error) {
            console.error("Error creating user:", error);
            throw new BadRequestException("Cannot create user!");
        }
    }
    

    async findbyEmail(email: string): Promise<{ id: number; name: string; email: string; status: string; role: string }>{//error handling find email
        try {
            const matchEmail = await this.userRepository.findbyEmail(email);
            if(!matchEmail){
                throw new NotFoundException("Email has not been registered!");
            }
            return matchEmail;   
        } catch (error) {
            throw new NotFoundException("The email is not exist!");
            
        }
    }

    async findbyUsername(username: string):Promise<User|null>{// error handling find name
        try {
            const matchUsername = await this.userRepository.findbyUsername(username);
            console.log(matchUsername);
            if(!matchUsername){
                throw new NotFoundException("Username has not been registered!");
            }
            return matchUsername;   
        } catch (error) {
            throw new NotFoundException("The username is not exist!");
            
        }
    }

    async findbyId(id: number){// error handling find id
        try {
            const user = await this.userRepository.findbyId(id);
            if(!user){
                throw new NotFoundException("Id not exist");
            }
            return user;
        } catch (error) {
            throw new NotFoundException("The user id is not exist!");
            
        }
    }

    async delete(id: number): Promise<{message: string; success: boolean  }> {// error handling for delete
        try {
            console.log(`trying to delete id ${id}`);
            const deleteResult = await this.userRepository.delete(id);
            console.log('user delete:', deleteResult);
            return {message: 'Data successfully deleted', success: !!deleteResult}
            // Return success flag
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    // "Record to delete does not exist."
                    throw new NotFoundException('User not found or already deleted!');
                }
            }
            console.error('Error deleting user:', error); // Log error for debugging
            throw new InternalServerErrorException('Unable to delete user!');
        }
        
    }
    

    async  getAllUser(): Promise<Partial<User>[]>{// error handling get all user
        try {
            const allUser = await this.userRepository.getAllUser();
            console.log('the all user:', allUser);
            if(!allUser ||  allUser.length == 0){
                throw new NotFoundException("No User found!");
            }
            return allUser;
            
        } catch (error) {
            throw new NotFoundException("No user registered!");
        }
        //fetch all task in the database

    
    }

    //get all using pagination
   
    async getUsers(page: number, pageSize: number, filters?: any): Promise<PaginationResult<any>> {
        try {
            const findAllUserPagination = await this.userRepository.findAllPaginated(page, pageSize, filters);
            
            if (!findAllUserPagination) {
                throw new NotFoundException("No User found!");
            }
            
            return findAllUserPagination;
        } catch (error) {
            throw new NotFoundException("No user registered!");
        }
    }
    

    async updateActive(id:number){//error handling updata data status
        const updateActive = await this.userRepository.findbyId(id);
        if (!updateActive){
            throw new NotFoundException("cannot update status!");
        }
        const newStatus = updateActive.status === Status.Active ? Status.Inactive : Status.Active;
        
        try {
            const changeStatus = await this.userRepository.update(id, { 
                status: newStatus 
            });
            return changeStatus;
        } catch (error) {
            throw new NotFoundException("status cannot be updated!");
        }
         
     }

     async updateUser(email: string, data: Partial<CreateUserDTO>): Promise<{ id: number; email: string; name: string; password: string; roles: string; status?: Status;}>{

        const user = await this.userRepository.findbyEmail(email);
        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }
        
        if(data.name){
            const existName = await this.prisma.user.findUnique({
                where: {name: data.name}
            })
            if(existName && existName.id !== user.id){
                console.log('name already used');
                throw new BadRequestException('Name already used');
            }
           
        }
        let updateData: any = { ...data };
    
        if (data.roles) {
            const existingRole = await this.prisma.role.findUnique({
                where: { roleName: data.roles }
            });
    
            if (!existingRole) {
                throw new BadRequestException(`Invalid Role: ${data.roles}`);
            }
            updateData.roleId = existingRole.id; // Convert role name to role ID
            delete updateData.roles;
    
            //data = { ...data, roleId: existingRole.id };
        }
    
        const updatedUser = await this.prisma.user.update({
            where: { email },
            data: updateData,
            include: { role: true },
        });
    
        return {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            password: updatedUser.password, // Ensure password is included
            roles: updatedUser.role?.roleName || '',
            status: updatedUser.status || undefined // Ensure status is optional
        };
    }
    
    
    
}