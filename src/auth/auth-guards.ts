import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';



@Injectable()
export class AuthGuard implements CanActivate{
    constructor(private jwtService: JwtService){}

    async canActivate(context: ExecutionContext):Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if(!token){
            throw new UnauthorizedException('Authorization token is missing'); 
        }

        try {
            const isValid = await this.jwtService.verifyAsync(token);
            console.log("Decoded JWT:", isValid);
            request.user = isValid;
            console.log("Request user after decoding:", request.user);
            
            return true;
        } catch (error) {
           throw new UnauthorizedException('Invalid or Expired tokens!');
            
        }
        
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const authorization = request.headers.authorization;
        if (!authorization) return undefined;
        const [type, token] = authorization?.split(' ');
        return type === 'Bearer' ? token: undefined;
    }


}