import { governanceService } from '../governanceService';
import { permissionsService } from '../permissionsService';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface AuditContext {
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

class PermissionMiddleware {
  private async logPermissionAttempt(
    permissionKey: string,
    granted: boolean,
    context?: AuditContext
  ): Promise<void> {
    try {
      const result = await governanceService.checkPermission(permissionKey);
      console.log(`Permission check: ${permissionKey} = ${result ? 'GRANTED' : 'DENIED'}`);
    } catch (error) {
      console.error('Failed to log permission attempt:', error);
    }
  }

  async requirePermission(
    permissionKey: string,
    context?: AuditContext
  ): Promise<void> {
    const granted = await permissionsService.checkPermission(permissionKey as any, 'full');

    await this.logPermissionAttempt(permissionKey, granted, context);

    if (!granted) {
      throw new Error(`Access denied: Missing required permission '${permissionKey}'`);
    }
  }

  async requireReadPermission(
    permissionKey: string,
    context?: AuditContext
  ): Promise<void> {
    const granted = await permissionsService.checkPermission(permissionKey as any, 'read_only');

    await this.logPermissionAttempt(permissionKey, granted, context);

    if (!granted) {
      throw new Error(`Access denied: Missing required permission '${permissionKey}'`);
    }
  }

  async checkPermission(permissionKey: string): Promise<PermissionCheckResult> {
    try {
      const granted = await permissionsService.checkPermission(permissionKey as any, 'full');
      await this.logPermissionAttempt(permissionKey, granted);

      return {
        allowed: granted,
        reason: granted ? undefined : `Missing permission: ${permissionKey}`
      };
    } catch (error) {
      return {
        allowed: false,
        reason: `Permission check failed: ${error}`
      };
    }
  }

  async withPermission<T>(
    permissionKey: string,
    operation: () => Promise<T>,
    context?: AuditContext
  ): Promise<T> {
    await this.requirePermission(permissionKey, context);
    return operation();
  }

  async withReadPermission<T>(
    permissionKey: string,
    operation: () => Promise<T>,
    context?: AuditContext
  ): Promise<T> {
    await this.requireReadPermission(permissionKey, context);
    return operation();
  }

  async requireFeatureAccess(featureKey: string): Promise<void> {
    const hasAccess = await governanceService.checkFeatureAccess(featureKey);

    if (!hasAccess) {
      throw new Error(`Feature not available: ${featureKey}`);
    }
  }

  async withFeatureAccess<T>(
    featureKey: string,
    operation: () => Promise<T>
  ): Promise<T> {
    await this.requireFeatureAccess(featureKey);
    return operation();
  }

  canViewDashboards = () => permissionsService.canViewDashboards();
  canEditDashboards = () => permissionsService.canEditDashboards();
  canEditClinics = () => permissionsService.canEditClinics();
  canViewStaffing = () => permissionsService.canViewStaffing();
  canEditStaffing = () => permissionsService.canEditStaffing();
  canViewCredentials = () => permissionsService.canViewCredentials();
  canEditCredentials = () => permissionsService.canEditCredentials();
  canViewAIInsights = () => permissionsService.canViewAIInsights();
  canAccessAuditLogs = () => permissionsService.canAccessAuditLogs();
}

export const permissionMiddleware = new PermissionMiddleware();

export function requirePermission(permissionKey: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      await permissionMiddleware.requirePermission(permissionKey, {
        action: propertyKey,
        resourceType: target.constructor.name
      });

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export function requireFeature(featureKey: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      await permissionMiddleware.requireFeatureAccess(featureKey);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
