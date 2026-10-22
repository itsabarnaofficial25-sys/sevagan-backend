import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (!authHeader) {
            console.log('❌ No authorization header');
            throw new UnauthorizedException('No token provided');
        }
        
        console.log('✅ Authorization header present');
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        if (err || !user) {
            console.log('❌ Auth failed:', err?.message || 'No user');
            throw err || new UnauthorizedException('Invalid token');
        }
        console.log('✅ Auth success:', user.email || user.phone);
        return user;
    }
}