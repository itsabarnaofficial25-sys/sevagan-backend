import { IsString, IsNotEmpty, IsPhoneNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class RequestOtpDto {
    @ApiProperty({ example: '+919876543210' })
    @IsPhoneNumber('IN')
    @IsNotEmpty()
    phone: string;
}

export class VerifyOtpDto {
    @ApiProperty({ example: '+919876543210' })
    @IsPhoneNumber('IN')
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ enum: UserRole, required: false })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}

export class UpdateFcmTokenDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fcmToken: string;
}
