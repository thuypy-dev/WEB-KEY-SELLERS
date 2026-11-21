import { Controller, Get, Post, Param, Query, UseGuards, DefaultValuePipe, ParseIntPipe, Patch, Body } from '@nestjs/common';
import { AdminUserService } from '../../services/admin-user/admin-user.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../../guard/role.guard';
import { Roles } from '../../decorator/role.decorator';
import { Role } from '@prisma/client';
import { CreateStaffDto } from '../../dto/create-staff.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(Role.ADMIN, Role.SUPPORT)
export class UserController {
  constructor(private readonly userService: AdminUserService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() data: CreateStaffDto) {
    return this.userService.createStaff(data);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Query('role') roles: string,
  ) {
    let roleFilter: Role[] | undefined = undefined;
    if (roles) {
        roleFilter = roles.split(',').map(r => r.trim() as Role);
    }
    return this.userService.findAll({ page, limit, search, role: roleFilter });
  }

  @Get(':id')
  findOne(@Param('id') id: string) { // User ID là String
    return this.userService.findOne(id);
  }
  
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() data: any) {
    return this.userService.update(id, data);
  }
}