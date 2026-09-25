import { Body, Controller, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SubjectType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { CurrentUser, RequireAnyPermission, RequirePermissions } from '../../common/decorators';
import type { CurrentUserData } from '../../common/context/auth-user';
import { AcademicService } from './academic.service';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

class TermDto {
  @IsString() @MaxLength(40) name: string;
  @Matches(ISO) startDate: string;
  @Matches(ISO) endDate: string;
  @Matches(ISO) dueDate: string;
  @IsOptional() @Matches(ISO) invoiceDate?: string;
  @IsOptional() @IsBoolean() autoGenerateInvoices?: boolean;
}
class CreateYearDto {
  @Matches(/^\d{4}-\d{2}$/, { message: 'Name must look like 2026-27' }) name: string;
  @Matches(ISO) startDate: string;
  @Matches(ISO) endDate: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => TermDto) terms: TermDto[];
}
class UpdateYearDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}$/) name?: string;
  @IsOptional() @Matches(ISO) startDate?: string;
  @IsOptional() @Matches(ISO) endDate?: string;
}
class RollForwardDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}$/) name?: string;
}
class UpdateTermDto {
  @IsOptional() @IsString() @MaxLength(40) name?: string;
  @IsOptional() @Matches(ISO) startDate?: string;
  @IsOptional() @Matches(ISO) endDate?: string;
  @IsOptional() @Matches(ISO) invoiceDate?: string;
  @IsOptional() @IsBoolean() autoGenerateInvoices?: boolean;
}
class CreateSectionDto {
  @IsString() academicYearId: string;
  @IsString() gradeId: string;
  @Matches(/^[A-Za-z0-9 ]{1,10}$/) name: string;
  @IsOptional() @IsInt() @Min(1) @Max(80) capacity?: number;
  @IsOptional() @IsString() room?: string;
  @IsOptional() @IsString() classTeacherId?: string;
}
class UpdateSectionDto {
  @IsOptional() @Matches(/^[A-Za-z0-9 ]{1,10}$/) name?: string;
  @IsOptional() @IsInt() @Min(1) @Max(80) capacity?: number;
  @IsOptional() @IsString() room?: string;
  @IsOptional() @IsString() classTeacherId?: string | null;
}
class SubjectDto {
  @IsString() @MaxLength(60) name: string;
  @Matches(/^[A-Za-z0-9_-]{2,12}$/) code: string;
  @IsOptional() @IsEnum(SubjectType) type?: SubjectType;
}
class SectionSubjectItem {
  @IsString() subjectId: string;
  @IsOptional() @IsString() teacherId?: string | null;
  @IsOptional() @IsInt() @Min(0) @Max(20) periodsPerWeek?: number;
}
class SectionSubjectsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => SectionSubjectItem) items: SectionSubjectItem[];
}

@ApiTags('Academic structure')
@ApiBearerAuth()
@Controller('academic')
export class AcademicController {
  constructor(private readonly academic: AcademicService) {}

  @Get('years')
  years(@CurrentUser() u: CurrentUserData) {
    return this.academic.years(u.schoolId);
  }

  @Get('years/:id')
  year(@CurrentUser() u: CurrentUserData, @Param('id') id: string) {
    return this.academic.year(u.schoolId, id);
  }

  @Post('years')
  @RequirePermissions('settings.academic_year')
  createYear(@CurrentUser() u: CurrentUserData, @Body() dto: CreateYearDto) {
    return this.academic.createYear(u.schoolId, dto);
  }

  @Patch('years/:id')
  @RequirePermissions('settings.academic_year')
  updateYear(@CurrentUser() u: CurrentUserData, @Param('id') id: string, @Body() dto: UpdateYearDto) {
    return this.academic.updateYear(u.schoolId, id, dto);
  }

  @Post('years/:id/set-current')
  @RequirePermissions('settings.academic_year')
  @HttpCode(200)
  setCurrent(@CurrentUser() u: CurrentUserData, @Param('id') id: string) {
    return this.academic.setCurrent(u.schoolId, id);
  }

  @Post('years/:id/archive')
  @RequirePermissions('settings.academic_year')
  @HttpCode(200)
  archive(@CurrentUser() u: CurrentUserData, @Param('id') id: string) {
    return this.academic.archive(u.schoolId, id);
  }

  @Post('years/:id/roll-forward')
  @RequirePermissions('settings.academic_year')
  rollForward(@CurrentUser() u: CurrentUserData, @Param('id') id: string, @Body() dto: RollForwardDto) {
    return this.academic.rollForward(u.schoolId, id, dto);
  }

  @Patch('terms/:id')
  @RequirePermissions('settings.academic_year')
  updateTerm(@CurrentUser() u: CurrentUserData, @Param('id') id: string, @Body() dto: UpdateTermDto) {
    return this.academic.updateTerm(u.schoolId, id, dto);
  }

  @Get('grades')
  grades(@CurrentUser() u: CurrentUserData) {
    return this.academic.grades(u.schoolId);
  }

  @Get('classes')
  classes(@CurrentUser() u: CurrentUserData) {
    return this.academic.classOptions(u.schoolId);
  }

  @Get('sections')
  sections(@CurrentUser() u: CurrentUserData, @Query('academicYearId') academicYearId?: string, @Query('gradeId') gradeId?: string) {
    return this.academic.sections(u.schoolId, { academicYearId, gradeId });
  }

  @Post('sections')
  @RequirePermissions('academics.manage')
  createSection(@CurrentUser() u: CurrentUserData, @Body() dto: CreateSectionDto) {
    return this.academic.createSection(u.schoolId, dto);
  }

  @Patch('sections/:id')
  @RequirePermissions('academics.manage')
  updateSection(@CurrentUser() u: CurrentUserData, @Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.academic.updateSection(u.schoolId, id, dto);
  }

  @Get('subjects')
  subjects(@CurrentUser() u: CurrentUserData) {
    return this.academic.subjects(u.schoolId);
  }

  @Post('subjects')
  @RequirePermissions('academics.manage')
  createSubject(@CurrentUser() u: CurrentUserData, @Body() dto: SubjectDto) {
    return this.academic.createSubject(u.schoolId, dto);
  }

  @Patch('subjects/:id')
  @RequirePermissions('academics.manage')
  updateSubject(@CurrentUser() u: CurrentUserData, @Param('id') id: string, @Body() dto: Partial<SubjectDto>) {
    return this.academic.updateSubject(u.schoolId, id, dto);
  }

  @Get('sections/:id/subjects')
  @RequireAnyPermission('academics.view', 'academics.manage')
  sectionSubjects(@Param('id') id: string) {
    return this.academic.sectionSubjects(id);
  }

  @Put('sections/:id/subjects')
  @RequirePermissions('academics.manage')
  setSectionSubjects(@CurrentUser() u: CurrentUserData, @Param('id') id: string, @Body() dto: SectionSubjectsDto) {
    return this.academic.setSectionSubjects(u.schoolId, id, dto.items);
  }
}
