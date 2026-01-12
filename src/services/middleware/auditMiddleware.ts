import { supabase } from '../../lib/supabase';

export type AuditAction =
  | 'insert'
  | 'update'
  | 'delete'
  | 'select'
  | 'login'
  | 'logout'
  | 'access'
  | 'permission_check'
  | 'feature_access'
  | 'api_call';

export interface AuditEntry {
  action: AuditAction;
  table_name?: string;
  record_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  changed_fields?: string[];
  metadata?: Record<string, unknown>;
  event_type?: string;
  status?: string;
}

class AuditMiddleware {
  async logEvent(entry: AuditEntry): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        console.warn('No authenticated user for audit log');
        return;
      }

      const auditRecord = {
        user_id: user.user.id,
        action: entry.action,
        table_name: entry.table_name,
        record_id: entry.record_id,
        old_data: entry.old_data,
        new_data: entry.new_data,
        changed_fields: entry.changed_fields,
        event_type: entry.event_type,
        status: entry.status,
        metadata: entry.metadata
      };

      const { error } = await supabase
        .from('audit_events')
        .insert(auditRecord);

      if (error) {
        console.error('Failed to write audit log:', error);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  async logMutation<T>(
    action: 'insert' | 'update' | 'delete',
    tableName: string,
    operation: () => Promise<T>,
    options?: {
      oldData?: Record<string, unknown>;
      newData?: Record<string, unknown>;
      recordId?: string;
    }
  ): Promise<T> {
    const startTime = Date.now();
    let result: T;
    let error: Error | null = null;

    try {
      result = await operation();

      await this.logEvent({
        action,
        table_name: tableName,
        record_id: options?.recordId,
        old_data: options?.oldData,
        new_data: options?.newData,
        changed_fields: this.getChangedFields(options?.oldData, options?.newData),
        status: 'success',
        metadata: {
          duration_ms: Date.now() - startTime
        }
      });

      return result;
    } catch (err: any) {
      error = err;

      await this.logEvent({
        action,
        table_name: tableName,
        record_id: options?.recordId,
        status: 'failed',
        metadata: {
          error: err.message,
          duration_ms: Date.now() - startTime
        }
      });

      throw err;
    }
  }

  async logAccess(resourceType: string, resourceId?: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.logEvent({
      action: 'access',
      table_name: resourceType,
      record_id: resourceId,
      status: 'success',
      metadata
    });
  }

  async logApiCall(endpoint: string, method: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.logEvent({
      action: 'api_call',
      event_type: endpoint,
      status: 'success',
      metadata: {
        method,
        ...metadata
      }
    });
  }

  private getChangedFields(
    oldData?: Record<string, unknown>,
    newData?: Record<string, unknown>
  ): string[] {
    if (!oldData || !newData) return [];

    const changed: string[] = [];
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changed.push(key);
      }
    }

    return changed;
  }

  async verifyAuditIntegrity(tableName: string, recordId: string): Promise<{
    valid: boolean;
    eventCount: number;
    lastModified?: string;
  }> {
    try {
      const { data: events, error } = await supabase
        .from('audit_events')
        .select('*')
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        valid: true,
        eventCount: events?.length || 0,
        lastModified: events?.[0]?.created_at
      };
    } catch (error) {
      console.error('Audit verification failed:', error);
      return {
        valid: false,
        eventCount: 0
      };
    }
  }

  async getAuditHistory(
    tableName: string,
    recordId: string,
    limit = 50
  ): Promise<Array<{
    action: string;
    changed_fields: string[];
    timestamp: string;
    user_id: string;
  }>> {
    try {
      const { data: events, error } = await supabase
        .from('audit_events')
        .select('action, changed_fields, created_at, user_id')
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (events || []).map(e => ({
        action: e.action,
        changed_fields: e.changed_fields || [],
        timestamp: e.created_at,
        user_id: e.user_id
      }));
    } catch (error) {
      console.error('Failed to fetch audit history:', error);
      return [];
    }
  }
}

export const auditMiddleware = new AuditMiddleware();

export function auditMutation(tableName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const action = propertyKey.startsWith('create') ? 'insert' :
                     propertyKey.startsWith('update') ? 'update' :
                     propertyKey.startsWith('delete') ? 'delete' : 'update';

      return auditMiddleware.logMutation(
        action,
        tableName,
        () => originalMethod.apply(this, args),
        {
          newData: args[0],
          recordId: args[0]?.id
        }
      );
    };

    return descriptor;
  };
}
