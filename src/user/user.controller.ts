import { Body, Controller, Get, Post, Query, UseGuards, Request, Delete, Param, ParseIntPipe, UnauthorizedException, NotFoundException, Put, ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDTO } from './dto/create-user-dto';
import { AuthGuard } from 'src/auth/auth-guards';
import { RolesGuard } from 'src/roles/roles.guard';
import { Roles } from 'src/roles/roles.decorator';
import { Role } from '@prisma/client';
import { PermissionsGuard } from 'src/roles/permissions.guard';
import { Action } from 'src/roles/permissions.decorator';
import { PaginationResult } from './entities/pagination.entity';



@Controller('user')
export class UserController {
    constructor(private userService: UserService){};


    @Post()
    @UseGuards(AuthGuard, PermissionsGuard)
    // @Roles('Owner')
    @Action('CREATE_USER')
    create(@Body() createUserDto: CreateUserDTO){
        console.log("Received Role from Postman:", JSON.stringify(createUserDto, null, 2)); 
        // if (!createUserDto.role) {
        //     throw new BadRequestException(" 'role' is missing in request body!");
        // }
        return this.userService.create(createUserDto);
    }

    @Get('email')
    @UseGuards(AuthGuard)
    findbyEmail(@Query('email') email : string){//Get method find email
       return this.userService.findbyEmail(email);
    }
    @Get('username')
    @UseGuards(AuthGuard)
    findbyUsername(@Query('username') username : string){//get method find name
       return this.userService.findbyUsername(username);
    }

    @Get('get-user')
    @UseGuards(AuthGuard, PermissionsGuard)
    //@Roles('Owner', 'Approver', 'Staff')
    @Action('GETALL_USER')
    getAllUser(){// send all data to the frontend side get all user
        return this.userService.getAllUser(); 
    }

    @Get('get-all')
    @UseGuards(AuthGuard, PermissionsGuard)
    @Action('GETALL_USER')
    async getUsers(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('email') email?: string,
    @Query('role') role?: string,
    @Query('status') status?: string
    ): Promise<PaginationResult<any>> {
        const pageNumber = parseInt(page, 10) || 1;
        const pageSizeNumber = parseInt(pageSize, 10) || 5;
        console.log('email ', email);
        console.log('status ', status);
        console.log('role ', role)
        console.log()

        // Construct filters dynamically
        const filters: any = {};
        if (email) filters.email = email;
        if (role) filters.role = role;
        if (status) filters.status = status;

        console.log('send data');

        return this.userService.getUsers(pageNumber, pageSizeNumber, filters);
    }


    @Get(':id')
    @UseGuards(AuthGuard, PermissionsGuard)
    @Action('GET_USER')
    //@Roles('Owner', 'Approver', 'Staff')
    async getProfile(@Param('id', ParseIntPipe) id: number, @Request() req){   //get specific user profile based on id
        const userId = req.user?.id; 
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }    
        const user = await this.userService.findbyId(id); 
        if(!user){
            throw new NotFoundException('User not found');
        }
        //console.log(user);
        //console.log('the role is', user.role?.roleName)
        return {name: user.name, email: user.email, roles: user.role?.roleName};
    }
    

    @Delete(':id')
    @UseGuards(AuthGuard, PermissionsGuard)
    //@Roles('Owner')
    @Action('DELETE_USER')
    async deleteId(@Param('id', ParseIntPipe) id: number, @Request() req){  //delete user based on id method 
        const userId = req.user?.id; 
        const targetUserId = id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }    
        console.log(`Owner (ID: ${userId}) wants to delete User (ID: ${targetUserId})`);
        if (userId === targetUserId) {
            throw new ForbiddenException("You cannot delete yourself.");
        }
        const user = await this.userService.findbyId(targetUserId);
        if (!user) {
            throw new NotFoundException('User not found!');
        }
        
        const deleted = await this.userService.delete(targetUserId);
        if (deleted) {
            return { message: 'User deleted successfully' };
        } else {
            console.log("cannot delete user")
            throw new NotFoundException('User could not be deleted!');
        }
    }

    @Put(':id')
    @UseGuards(AuthGuard, PermissionsGuard)
    @Action('UPDATE_USERSTATUS')
    async updateActive(@Param('id', ParseIntPipe) id: number, @Request() req, @Body() body: Partial<CreateUserDTO>){//put method change status
        const userId = req.user?.id; 
        const targetUserId = id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }    
        console.log(`Owner (ID: ${userId}) wants to update user status (ID: ${targetUserId})`);
        const user = await this.userService.findbyId(targetUserId);
        if (!user) {
            throw new NotFoundException('User not found!');
        }
        const updateActive = await this.userService.updateActive(targetUserId);
        return updateActive;
    }

    @Put('email/:email')
    @UseGuards(AuthGuard, PermissionsGuard)
    //@Roles('Owner')
    @Action('UPDATE_USERSDATA')
    async updateUser(@Param('email') email: string, @Request() req, @Body() body: Partial<CreateUserDTO>){//put method change user data
        const userEmail = req.user?.email; 
        const targetUserEmail = email;
        console.log(userEmail);
        if (!userEmail) {
            throw new UnauthorizedException('User not authenticated');
        }    
        console.log(`Owner (email: ${userEmail}) wants to update user status (email: ${targetUserEmail})`);
        const user = await this.userService.findbyEmail(targetUserEmail);
        if(!user){
            throw new NotFoundException('User not found');
        }
        const updateData = await this.userService.updateUser(targetUserEmail, body);
        return updateData;

    }

}

