import { Transform } from "class-transformer";
import {IsOptional, IsString, MaxLength, MinLength, IsNotEmpty, IsEmail, Matches, IsStrongPassword, IsArray, ArrayNotEmpty, IsEnum } from "class-validator";
import { Prisma, Status } from '@prisma/client';
import { Role } from "@prisma/client";


export class CreateAuthDTO {
    @Transform(({ value }) => value.toLowerCase())
    @IsNotEmpty()
    @IsEmail()
    @IsString()
    readonly email: string;

    @IsString()
    @MaxLength(50)
    @MinLength(3)
    readonly name: string;

    @IsStrongPassword({
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })
    readonly password: string;
    @IsString()
    @IsNotEmpty()
    readonly roles: string;

    readonly status: Status;


}

export class LoginDTO {
    @IsString()
    @IsNotEmpty()
    readonly name: string;
    @IsNotEmpty()
    readonly password: string;

}