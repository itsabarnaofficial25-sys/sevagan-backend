import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('DATABASE_HOST'),
                port: configService.get('DATABASE_PORT'),
                username: configService.get('DATABASE_USER'),
                password: configService.get('DATABASE_PASSWORD'),
                database: configService.get('DATABASE_NAME'),
                entities: [__dirname + '/../**/*.entity{.ts,.js}'],
                synchronize: configService.get('NODE_ENV') === 'development',
                logging: ['error'],
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: async (configService: ConfigService) => {
                try {
                    const client = createClient({
                        socket: {
                            host: configService.get('REDIS_HOST'),
                            port: configService.get('REDIS_PORT'),
                        },
                    });
                    await client.connect();
                    console.log('✅ Redis connected');
                    return client;
                } catch (error) {
                    console.warn('⚠️ Redis not available, running without Redis');
                    return {
                        get: async () => null,
                        set: async () => {},
                        setEx: async () => {},
                        del: async () => {},
                        disconnect: async () => {},
                    };
                }
            },
            inject: [ConfigService],
        },
    ],
    exports: ['REDIS_CLIENT'],
})
export class DatabaseModule { }