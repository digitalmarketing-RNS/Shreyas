import { Global, Module } from '@nestjs/common';
import { PrincipalCache } from '../common/guards/principal-cache';
import { AuditService } from './audit/audit.service';
import { ExcelService } from './excel/excel.service';
import { JobsService } from './jobs/jobs.service';
import { PdfService } from './pdf/pdf.service';
import { SequenceService } from './sequence/sequence.service';
import { SchoolService } from './settings/school.service';
import { StorageService } from './storage/storage.service';
import { ScopeService } from './scope.service';

const providers = [AuditService, SequenceService, SchoolService, StorageService, JobsService, PdfService, ExcelService, PrincipalCache, ScopeService];

@Global()
@Module({ providers, exports: providers })
export class CoreModule {}
