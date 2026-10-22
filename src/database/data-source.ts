import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Export as default (not named export)
const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'postgres',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER || 'sevagan_user',
    password: process.env.DATABASE_PASSWORD || 'sevagan_password',
    database: process.env.DATABASE_NAME || 'sevagan',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: true,
});

export default AppDataSource;