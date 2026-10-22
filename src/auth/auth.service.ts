import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from '../users/entities/user.entity';
import admin from '../config/firebase';
import { TechniciansService } from '../technicians/technicians.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly techniciansService: TechniciansService,
    ) { }

    async validateUser(phone: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { phone },
        });
    }

    // Firebase sends OTP directly
    async requestOtpViaFirebase(phone: string) {
        return {
            success: true,
            message: 'OTP sent via Firebase',
        };
    }

    async verifyFirebaseToken(idToken: string, role: string) {
        try {
            console.log('=================================');
            console.log('VERIFY API CALLED');
            console.log('=================================');

            console.log('Role received:', role);

            const decoded = await admin.auth().verifyIdToken(idToken);

            console.log('Firebase verification SUCCESS');
            console.log(decoded);

            let phone = decoded.phone_number;

            console.log('Phone from Firebase:', phone);

            if (!phone) {
                throw new UnauthorizedException('Phone missing');
            }

            phone = phone.replace(/\D/g, '').slice(-10);

            console.log('Normalized Phone:', phone);

            let user = await this.userRepository.findOne({
                where: {
                    phone,
                },
            });

            console.log('Database Result:');
            console.log(user);

            // Auto create technician on first login
            if (!user) {
                if (role?.toUpperCase() === UserRole.TECHNICIAN) {

                    user = this.userRepository.create({
                        phone,
                        role: UserRole.TECHNICIAN,
                        name: '',
                        email: '',
                        isProfileComplete: false,
                    });

                    await this.userRepository.save(user);

                    await this.techniciansService.create(user.id, {
                        name: '',
                        skills: [],
                        experience: 0,
                    });

                    console.log('New Technician Created');

                } else {
                    throw new UnauthorizedException('User not registered');
                }
            }

            console.log('Database Role:', user.role);

            if (
                role &&
                user.role.toUpperCase() !== role.toUpperCase()
            ) {
                console.log('Role Mismatch');
                console.log('App Role:', role);
                console.log('DB Role:', user.role);

                throw new UnauthorizedException('Invalid role');
            }

            const accessToken = this.jwtService.sign({
                sub: user.id,
                phone: user.phone,
                role: user.role,
                email: user.email,
            });

            console.log('LOGIN SUCCESS');

            return {
                accessToken,
                user: {
                    id: user.id,
                    phone: user.phone,
                    role: user.role,
                    name: user.name,
                    email: user.email,
                    isProfileComplete: user.isProfileComplete,
                },
            };

        } catch (e) {
            console.log('VERIFY FAILED');
            console.log(e);
            throw e;
        }
    }

    async loginWithPassword(phone: string, password: string) {
        const user = await this.userRepository.findOne({
            where: {
                phone,
                role: UserRole.CUSTOMER,
            },
            select: [
                'id',
                'phone',
                'role',
                'name',
                'email',
                'password',
                'isProfileComplete',
            ],
        });

        if (!user) {
            throw new UnauthorizedException('User not registered');
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

        const accessToken = this.jwtService.sign({
            sub: user.id,
            phone: user.phone,
            role: user.role,
            email: user.email,
        });

        return {
            accessToken,
            user: {
                id: user.id,
                phone: user.phone,
                role: user.role,
                name: user.name,
                email: user.email,
                isProfileComplete: user.isProfileComplete,
            },
        };
    }

    async register(body: {
        name: string;
        mobileNumber: string;
        email?: string;
        password: string;
        role: string;
    }) {

        const existingUser = await this.userRepository.findOne({
            where: {
                phone: body.mobileNumber,
            },
        });

        if (existingUser) {
            throw new ConflictException(
                'User already exists with this phone number',
            );
        }

        const hashedPassword = await bcrypt.hash(body.password, 10);

        const user = this.userRepository.create({
            name: body.name,
            phone: body.mobileNumber,
            email: body.email,
            password: hashedPassword,
            role: body.role.toUpperCase() as UserRole,
            isProfileComplete: true,
        });

        await this.userRepository.save(user);

        // Create technician profile only for technician users
        if (user.role === UserRole.TECHNICIAN) {

            const technician =
                await this.techniciansService.findByUserId(user.id);

            if (!technician) {

                await this.techniciansService.create(user.id, {
                    name: user.name,
                    skills: [],
                    experience: 0,
                });

                console.log('New Technician Profile Created');
            }
        }

        console.log('New User Created');

        const accessToken = this.jwtService.sign({
            sub: user.id,
            phone: user.phone,
            role: user.role,
            email: user.email,
        });

        return {
            accessToken,
            user: {
                id: user.id,
                phone: user.phone,
                role: user.role,
                name: user.name,
                email: user.email,
                isProfileComplete: user.isProfileComplete,
            },
        };
    }
}