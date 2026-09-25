import type { DashboardKind, DataScope } from '@prisma/client';

/** The authenticated principal attached to every request by JwtAuthGuard. */
export interface CurrentUserData {
  id: string;
  schoolId: string;
  name: string;
  username: string;
  roleId: string;
  roleKey: string;
  dashboard: DashboardKind;
  dataScope: DataScope;
  permissions: string[];
  staffId: string | null;
  guardianId: string | null;
}
