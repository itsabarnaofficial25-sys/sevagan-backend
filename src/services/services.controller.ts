import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('services')
@Controller('services')
export class ServicesController {
    constructor(private servicesService: ServicesService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all active service categories' })
    async findAll() {
        return this.servicesService.findAll();
    }
}
