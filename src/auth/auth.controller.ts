import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post, UseGuards, Request, Delete, Param, ParseIntPipe, UnauthorizedException, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDTO, LoginDTO } from './dto/create-auth-dto';
import { AuthGuard } from './auth-guards';
import { Role } from '@prisma/client';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}

    @HttpCode(HttpStatus.OK)
    @Post('register')
    async register(@Body() createAuthDTO: CreateAuthDTO){
        const newUser = await this.authService.register(createAuthDTO);
        console.log('User signed up successfully:', newUser);
        return newUser;
    }
    @HttpCode(HttpStatus.OK)
    @Post('login')
    async userValidation(@Body() loginDTO: LoginDTO){
        const login = await this.authService.userValidation(loginDTO);
        console.log('User logged in successfully:', login);
        return login;
    }

    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    //@UseGuards(AuthGuard)
    async refreshToken(@Body('refresh_token') refresh_token: string) {
        if (!refresh_token) throw new UnauthorizedException('Refresh token is required');

        return this.authService.refreshToken(refresh_token); 
    }

    @HttpCode(HttpStatus.OK)
    @Post('logout')
    //@UseGuards(AuthGuard)
    async logout(@Body('refresh_token') refresh_token: string) {
        await this.authService.logout(refresh_token);
        console.log("Logout successful");

        return { message: 'Logged out successfully' };
    }

    @Get('me')
    @UseGuards(AuthGuard)
    async getMe(@Req() req) {//for hiding button purpose in the frontend
        const user = req.user; 

        // Fetch user permissions based on role
        const permissions = await this.authService.getPermissionsByRole(user.roles);

        return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            roles: user.roles,
        },
        permissions, // Array of permission strings
        };
    }

}
