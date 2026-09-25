import { Body, Controller, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardKind, DataScope, UserStatus } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { CurrentUser, RequirePermissions } from '../../common/decorators';
import type { CurrentUserData } from '../../common/context/auth-user';
import { PaginationQueryDto, pageArgs, paginated } from '../../common/dto/pagination.dto';
import { PASSWORD_MESSAGE, PASSWORD_RULE } from '../auth/dto/auth.dto';
import { UsersService } from './users.service';

class SetPermissionsDto {
  @IsArray() @ArrayMaxSize(500) @IsString({ each: true }) permissions: string[];
}
class CreateRoleDto {
  @IsString() @MinLength(2) @MaxLength(60) name: string;
  @IsOptional() @IsString() @MaxLength(200) description?: string;
  @IsEnum(DashboardKind) dashboard: DashboardKind;
  @IsEnum(DataScope) dataScope: DataScope;
  @IsOptional() @IsString() copyFromRoleId?: string;
}
class UpdateRoleDto {
  @IsOptional() @IsString() @MaxLength(60) name?: string;
  @IsOptional() @IsString() @MaxLength(200) description?: string;
  @IsOptional() @IsEnum(DashboardKind) dashboard?: DashboardKind;
  @IsOptional() @IsEnum(DataScope) dataScope?: DataScope;
}
class CreateUserDto {
  @IsString() @MinLength(2) @MaxLength(100) name: string;
  @IsString() @Matches(/^[a-zA-Z0-9._@-]{3,60}$/, { message: 'Username may contain letters, numbers, dot, underscore, @ and hyphen' }) username: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @Matches(/^\+?\d{10,13}$/) phone?: string;
  @IsString() roleId: string;
  @IsOptional() @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE }) password?: string;
  @IsOptional() @IsString() staffId?: string;
}
class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @Matches(/^\+?\d{10,13}$/) phone?: string;
  @IsOptional() @IsString() roleId?: string;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
}
class UserQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() roleId?: string;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
}

@ApiTags('Users & Roles')
@ApiBearerAuth()
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('roles')
  @RequirePermissions('settings.roles')
  roles(@CurrentUser() u: CurrentUserData) {
    return this.users.roles(u.schoolId);
  }

  @Get('roles/options')
  @RequirePermissions('settings.users')
  async roleOptions(@CurrentUser() u: CurrentUserData) {
    return (await this.users.roles(u.schoolId)).map((r) => ({ id: r.id, key: r.key, name: r.name }));
  }

  @Post('roles')
  @RequirePermissions('settings.roles')
  createRole(@CurrentUser() u: CurrentUserData, @Body() dto: CreateRoleDto) {
    return this.users.createRole(u.schoolId, dto);
  }

  @Patch('roles/:id')
  @RequirePermissions('settings.roles')
  updateRole(@CurrentUser() u: CurrentUserData, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.users.updateRole(u.schoolId, id, dto);
  }

  @Put('roles/:id/permissions')
  @RequirePermissions('settings.roles')
  setPermissions(@CurrentUser() u: CurrentUserData, @Param('id') id: string, @Body() dto: SetPermissionsDto) {
    return this.users.setRolePermissions(u.schoolId, id, dto.permissions);
  }

  @Post('roles/:id/reset')
  @RequirePermissions('settings.roles')
  @HttpCode(200)
  resetRole(@CurrentUser() u: CurrentUserData, @Param('id') id: string) {
    return this.users.resetRole(u.schoolId, id);
  }

  @Get('users')
  @RequirePermissions('settings.users')
  async list(@CurrentUser() u: CurrentUserData, @Query() q: UserQueryDto) {
    const { skip, take, page, pageSize } = pageArgs(q);
    const { items, total } = await this.users.list(u.schoolId, { ...q, skip, take });
    return paginated(items, total, page, pageSize);
  }

  @Post('users')
  @RequirePermissions('settings.users')
  create(@CurrentUser() u: CurrentUserData, @Body() dto: CreateUserDto) {
    return this.users.create(u.schoolId, dto);
  }

  @Patch('users/:id')
  @RequirePermissions('settings.users')
  update(@CurrentUser() u: CurrentUserData, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(u.schoolId, id, dto, u.id);
  }

  @Post('users/:id/reset-password')
  @RequirePermissions('settings.users')
  @HttpCode(200)
  resetPassword(@CurrentUser() u: CurrentUserData, @Param('id') id: string) {
    return this.users.resetPassword(u.schoolId, id);
  }
}
