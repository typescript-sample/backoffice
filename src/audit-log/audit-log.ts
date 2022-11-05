import { Attributes, Filter, ViewSearchService } from 'onecore';

export interface AuditLog {
  id: string;
  resource: string;
  userId: string;
  ip: string;
  action: string;
  timestamp: string;
  status: string;
  remark?: string;
}
export interface AuditLogFilter extends Filter {
  id?: string;
  resource?: string;
  userId?: string;
  ip?: string;
  action?: string;
  timestamp?: string;
  status?: string;
}
export interface AuditLogService extends ViewSearchService<AuditLog, string, AuditLogFilter> {
}
export const auditLogModel: Attributes = {
  id: {
    key: true,
    length: 40
  },
  resource: {
    column: 'resourceType',
    match: 'equal'
  },
  userId: {
    required: true,
    length: 40,
    match: 'equal'
  },
  ip: {},
  action: {
    match: 'equal'
  },
  timestamp: {
    type: 'datetime'
  },
  status: {
    match: 'equal',
    length: 1
  },
  remark: {}
};
