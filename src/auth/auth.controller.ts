import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('otp')
    async requestOtp(@Body() body: { phone: string }) {
        // Use Firebase OTP directly - no backend verification needed
        return this.authService.requestOtpViaFirebase(body.phone);
    }

    @Post('verify')
    async verifyOtp(@Body() body: { idToken: string; role: string }) {
        return this.authService.verifyFirebaseToken(body.idToken, body.role);
    }
    @Post('login')
    async login(@Body() body: { phone: string; password: string }) {
        return this.authService.loginWithPassword(body.phone, body.password);
    }

    @Post('register')
    async register(@Body() body: {
        name: string;
        mobileNumber: string;
        email?: string;
        password: string;
        role: string;
    }) {
        return this.authService.register(body);
    }
}