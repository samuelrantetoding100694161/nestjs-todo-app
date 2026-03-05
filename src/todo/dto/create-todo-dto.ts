import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
//import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  @MaxLength(5, {message: 'the task is too long, max 5 characters'})
  task: string;

  @IsBoolean()
  @IsOptional()
  checklist?: boolean;

  @IsString()
  // @IsOptional()
  roles: string; 

  @IsString()
  users: string;

  // @IsInt()
  // @IsOptional()
  // roleId?: number;
}

export class UpdateTodoDto {
  @IsString()
  @IsOptional()
  task?: string;

  @IsBoolean()
  @IsOptional()
  checklist?: boolean;
}
