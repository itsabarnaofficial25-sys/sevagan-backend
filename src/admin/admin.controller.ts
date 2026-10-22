import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete, Query, Res, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, User } from '../users/entities/user.entity';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private jwtService: JwtService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    // ==================== PUBLIC ROUTES (No Auth Required) ====================

    @Post('login')
    @ApiOperation({ summary: 'Admin login' })
    async login(@Body() body: { email: string; password: string }) {
        console.log('Admin login attempt:', body.email);

        const admin = await this.adminService.adminLogin(body.email, body.password);

        const payload = {
            sub: admin.id,
            email: admin.email,
            role: admin.role,
        };
        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
        };
    }

    // ==================== PROTECTED ROUTES (Auth Required) ====================

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    async getStats() {
        return this.adminService.getDashboardStats();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Get('technicians')
    @ApiOperation({ summary: 'Get all technicians (with optional status filter)' })
    async getAllTechnicians(@Query('status') status?: string) {
        return this.adminService.getAllTechnicians(status);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Get('technicians/pending')
    @ApiOperation({ summary: 'Get pending technician approvals' })
    async getPendingTechnicians() {
        return this.adminService.getPendingTechnicians();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Post('technicians/:id/approve')
    @ApiOperation({ summary: 'Approve a technician' })
    async approveTechnician(@Param('id') id: string) {
        return this.adminService.approveTechnician(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Post('technicians/:id/reject')
    @ApiOperation({ summary: 'Reject a technician' })
    async rejectTechnician(@Param('id') id: string) {
        return this.adminService.rejectTechnician(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Post('technicians')
    @ApiOperation({ summary: 'Create a new technician (auto-approved)' })
    async createTechnician(@Body() data: any) {
        return this.adminService.createTechnician(data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Put('technicians/:id')
    @ApiOperation({ summary: 'Update technician details' })
    async updateTechnician(@Param('id') id: string, @Body() data: any) {
        return this.adminService.updateTechnician(id, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Delete('technicians/:id')
    @ApiOperation({ summary: 'Delete a technician' })
    async deleteTechnician(@Param('id') id: string) {
        return this.adminService.deleteTechnician(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Put('technicians/:id/toggle-status')
    @ApiOperation({ summary: 'Toggle technician active status' })
    async toggleTechnicianStatus(@Param('id') id: string, @Body() data: { isActive: boolean }) {
        return this.adminService.toggleTechnicianStatus(id, data.isActive);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Get('services')
    @ApiOperation({ summary: 'Get all service categories' })
    async getServices() {
        return this.adminService.getServiceCategories();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Post('services')
    @ApiOperation({ summary: 'Create a new service category' })
    async createService(@Body() data: any) {
        return this.adminService.createServiceCategory(data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Put('services/:id')
    @ApiOperation({ summary: 'Update a service category' })
    async updateService(@Param('id') id: string, @Body() data: any) {
        return this.adminService.updateServiceCategory(id, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Delete('services/:id')
    @ApiOperation({ summary: 'Delete a service category' })
    async deleteService(@Param('id') id: string) {
        return this.adminService.deleteServiceCategory(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Get('analytics')
    @ApiOperation({ summary: 'Get platform analytics' })
    async getAnalytics() {
        return this.adminService.getAnalytics();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Get('customers')
    @ApiOperation({ summary: 'Get all customers' })
    async getAllCustomers() {
        return this.adminService.getAllCustomers();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Post('categories')
    @ApiOperation({ summary: 'Create a new service category (deprecated - use POST /services)' })
    async createCategory(@Body() data: any) {
        return this.adminService.createServiceCategory(data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Get('jobs')
    @ApiOperation({ summary: 'Get all service requests with filters' })
    async getAllJobs(
        @Query('status') status?: string,
        @Query('city') city?: string,
        @Query('technicianId') technicianId?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.adminService.getAllJobs({
            status,
            city,
            technicianId,
            page: page || 1,
            limit: limit || 20,
        });
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Get('jobs/:id')
    @ApiOperation({ summary: 'Get job details with timeline' })
    async getJobDetails(@Param('id') id: string) {
        return this.adminService.getJobDetails(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Get('payments')
    @ApiOperation({ summary: 'Get all payments with filters' })
    async getAllPayments(
        @Query('status') status?: string,
        @Query('technicianId') technicianId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.adminService.getAllPayments({
            status,
            technicianId,
            startDate,
            endDate,
            page: parseInt(page as string, 10) || 1,
            limit: parseInt(limit as string, 10) || 20,
        });
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Get('payments/export')
    @ApiOperation({ summary: 'Export payments to CSV' })
    async exportPayments(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Res() res?: any,
    ) {
        const csv = await this.adminService.generatePaymentCSV({
            startDate,
            endDate,
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
        res.send(csv);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Post('jobs/:id/assign')
    @ApiOperation({ summary: 'Manually assign technician to a job' })
    async assignTechnician(
        @Param('id') jobId: string,
        @Body() data: { technicianId: string },
    ) {
        return this.adminService.manuallyAssignTechnician(jobId, data.technicianId);
    }
}