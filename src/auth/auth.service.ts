import { BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDTO, LoginDTO } from './dto/create-auth-dto';
import { Prisma, Role, Status, User } from '@prisma/client';
import { UserRepository } from 'src/user/user.repository';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from 'bcryptjs';
import { decryptPassword } from 'src/common/utils/crypto.utils';
import { AuthContract } from './contract/auth.contract';
import { Auth } from './entities/auth.entity';

@Injectable()
export class AuthService extends AuthContract{
    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService

    ){
        super();
    }

    async register(register: CreateAuthDTO): Promise<{ message: string; token: Auth }>{
        const {email, name, password, roles, status= Status.Active } = register;
        try{
            if(!email || !name || !password ||!roles){
                console.warn(`failed signup attempt! One of the fields required is missing! `);
                throw new HttpException("One of the fields required is missing!", HttpStatus.BAD_REQUEST);
            }
            const sameUser = await this.userRepository.findbyUsername(name);
            if(sameUser){
                console.warn(`the name already exists! Please use another name`);
                throw new HttpException("the name already exists! Please use another name", HttpStatus.BAD_REQUEST);
            }
            const sameEmail = await this.userRepository.findbyEmail(email);
            if(sameEmail){
                console.warn(`the email has been used before! Please use another email`);
                throw new HttpException("the email already registered! Please use another email", HttpStatus.BAD_REQUEST);
            }
            // Check if the role exists in the database
            const roleRecord = await this.prisma.role.findUnique({
                where: { roleName: roles }, select: { id: true , roleName: true}, // Validate by role name
                });
                if (!roleRecord) {
                    throw new BadRequestException(`Invalid role: ${roles}`);
                }
            // Use the correct role name
            const rolesId = roleRecord.id;
            const roleName = roleRecord.roleName;
            //const formattedRole = roleRecord.roleName;
            const decryptpassword = decryptPassword(password);//decrypt aes
            console.log('the decrypt password: ', decryptpassword);
            const encryptpassword = await bcrypt.hash(decryptpassword, 16);//set sall character as 16 for hashing
            const user = await this.userRepository.create(email, name, encryptpassword, roleName, status);
            console.log('register successfully!');
            const authInstance = await this.generateJwtToken({ ...user, role: roleName, roleId: rolesId });
            //return user;
            return {message: "New registration has been added!", token: {access_token: authInstance.access_token, 
                refresh_token: authInstance.refresh_token }};
        } catch(error){
            console.error("Error during signup validation", error);
            if (error instanceof HttpException) {//to prevent overriding the error inside try
                throw error;
            }
            throw new HttpException('Sign-up failed!', HttpStatus.BAD_REQUEST);
        }
    }

    async userValidation(validateUser: LoginDTO):Promise<{ message: string; token: Auth }>{
        const {name, password} = validateUser;
        try{
            const user = await this.userRepository.findbyUsername(name);
            if(!user){
                console.warn(`failed login attempt! the username ${name} is not exist! `);
                throw new HttpException(`Username ${name} does not exist.`, HttpStatus.UNAUTHORIZED);
             
            }
            const decryptpassword = decryptPassword(password);//decrypt aes
            console.log('the decrypt password: ', decryptpassword);
            console.log('the hash pass:', user.password);
            
            // Check if decrypted password is a valid string
        if (typeof decryptpassword !== 'string' || decryptpassword.trim() === '') {
            console.error('Decrypted password is invalid');
            throw new HttpException('Invalid password format', HttpStatus.UNAUTHORIZED);
        }

        // Check if the user password exists and is a string
        if (typeof user.password !== 'string' || user.password.trim() === '') {
            console.error('User password is invalid');
            throw new HttpException('Invalid password data in database', HttpStatus.UNAUTHORIZED);
        }
            const passwordValidate = await bcrypt.compare(decryptpassword, user.password);//compare
            console.log(passwordValidate);
            if(passwordValidate){
                const roleName = user.role;
                //const roleId = user.roles?.[0]?.role?.id || ""; 
                console.log('Role name:', roleName);
                const authInstance = await this.generateJwtToken({ ...user, role: roleName });
                console.log("success Login!");
                return {message: "Login successful!!",token: {access_token: authInstance.access_token, 
                    refresh_token: authInstance.refresh_token }};//change here
            } else{
                console.warn(`incorrect password for ${name}!`);
                throw new HttpException('incorrect password!', HttpStatus.UNAUTHORIZED);
            }
        } catch(error){
            console.error("Error during login validation", error);
            if (error instanceof HttpException) {//to prevent overriding the error inside try
                throw error;
            }
            throw new HttpException('Failed to login', HttpStatus.UNAUTHORIZED);
        }
    }

    async refreshToken(refresh_token: string): Promise<Auth> {
        try {
            let payload;
            try {
                payload = this.jwtService.verify(refresh_token, {
                    secret: process.env.JWT_REFRESH_SECRET,
                });
            } catch (error) {
                console.error('JWT Verification Failed:', error.message);
                throw new UnauthorizedException('Refresh token expired'); // Ensures correct error message
            }
    
            console.log('Decoded Payload:', payload);
    
            const storedToken = await this.prisma.refreshToken.findFirst({
                where: { userId: payload.id, token: refresh_token },
            });
    
            console.log('Stored Token:', storedToken);
    
            if (!storedToken) {
                console.log('Stored token not found in DB');
                throw new UnauthorizedException('Refresh token not found');
            }
    
            console.log('Token Expiration:', storedToken.expiresAt);
            console.log('Current Time:', new Date());
    
            if (!storedToken.expiresAt) {
                console.log('Token has no expiration date in DB');
                throw new UnauthorizedException('Invalid refresh token data');
            }
    
            if (new Date(storedToken.expiresAt) < new Date()) {
                console.log('Token expired.');
                throw new UnauthorizedException('Refresh token expired');
            }
    
            // Generate new access token only if it's eligible for refresh
            const newAccessToken = this.jwtService.sign(
                { id: payload.id, roles: payload.roles, email: payload.email, name: payload.name },
                {
                    secret: process.env.JWT_SECRET,
                    expiresIn: '30m',
                }
            );
    
            console.log('New Tokens Generated:', { access_token: newAccessToken, refresh_token });
    
            return { access_token: newAccessToken, refresh_token };
        } catch (error) {
            console.error('Error in refreshToken:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }
    
    

    async generateJwtToken(user: User & { role: string }): Promise<Auth>{
        const payload = {name: user.name, email: user.email, id: user.id , roles: user.role};
        const auth = new Auth();
         auth.access_token = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '30m'//set access token as 15 minute
        });
        auth.refresh_token = await this.jwtService.signAsync(payload,{
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '1d'//set refresh token as 1 day
        });
        console.log('Generated Refresh Token in DB:', auth.refresh_token);
        await this.prisma.refreshToken.deleteMany({//delete data in refreshtoken when exceeded the new date
            where: {
              userId: user.id,
              //expiresAt: { lt: new Date() }, // Remove expired tokens
            },
          });

        const savedToken = await this.prisma.refreshToken.create({
            data: {
              token: auth.refresh_token,
              userId: user.id,
              expiresAt: new Date(Date.now() +  24 * 60 * 60 * 1000), // 1 day expiration date for the refresh token (86.400.000 ms)
            },
          });
          console.log('Saved Refresh Token in DB:', savedToken);
        //   const checkToken = await this.prisma.refreshToken.findFirst({
        //     where: { userId: payload.id }, orderBy: { expiresAt: 'desc' },
        // });
        // console.log('Verifying Saved Token:', checkToken);
          
        return auth;

    }

    async logout(refresh_token: string) {
        if (!refresh_token) return;
    
        await this.prisma.refreshToken.deleteMany({
            where: { token: refresh_token },
        });
    }
    
    async getPermissionsByRole(role: string): Promise<string[]> {
        const roleData = await this.prisma.role.findUnique({
          where: { roleName: role },
          include: { RolePermission: true }, // Assuming role has a relation to permissions
        });
    
        return roleData?.RolePermission.map(p => p.action) || [];
      }

}
