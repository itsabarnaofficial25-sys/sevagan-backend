import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    getHealth() {
        return {
            status: 'ok',
            message: 'Sevagan API is running',
            timestamp: new Date().toISOString(),
            endpoints: {
                docs: '/api/docs',
                auth: '/api/auth',
                customers: '/api/customers',
                technicians: '/api/technicians',
                jobs: '/api/jobs',
                services: '/api/services',
                payments: '/api/payments',
                admin: '/api/admin',
            },
        };
    }
}
