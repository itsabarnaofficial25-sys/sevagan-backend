// backend/src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        });
    }

    async validate(payload: any): Promise<User> {
        console.log('==============================');
        console.log('JWT VALIDATE CALLED');
        console.log('Payload:', payload);

        const user = await this.userRepository.findOne({
            where: { id: payload.sub },
        });

        console.log('User:', user);

        if (!user) {
            console.log('USER NOT FOUND');
            throw new UnauthorizedException('Invalid token');
        }

        console.log('JWT SUCCESS');
        return user;
    }
}