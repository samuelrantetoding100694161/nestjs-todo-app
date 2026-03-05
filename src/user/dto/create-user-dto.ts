import { Role, Status } from "@prisma/client";
import {IsOptional, IsString, MaxLength, MinLength, IsNotEmpty, IsEmail, Matches, IsStrongPassword, IsArray, ArrayNotEmpty, IsEnum, IsInt } from "class-validator";


export class CreateUserDTO {
    @IsNotEmpty()
    @IsEmail()
    @IsString()
    @IsOptional()
    email: string;

    @IsString()
    @MaxLength(20)
    @MinLength(3)
    @IsOptional()
    name: string;

    @IsOptional()
    @IsStrongPassword({
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })
    password: string;

    @IsNotEmpty()
    @IsString() 
    roles: string; 

    @IsOptional()
    @IsEnum(Status) //Ensure only 'ACTIVE' or 'INACTIVE' is used
    status?: Status;
}


