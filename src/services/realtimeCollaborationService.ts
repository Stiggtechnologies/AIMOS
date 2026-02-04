import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface CollaborationUser {
  userId: string;
  userName: string;
  avatarUrl?: string;
  lastSeen: string;
  activeView?: string;
  cursor?: { x: number; y: number };
}

export interface CollaborationActivity {
  type: 'synthesis_updated' | 'translation_approved' | 'contradiction_detected' | 'pilot_started' | 'paper_added';
  userId: string;
  userName: string;
  timestamp: string;
  data: any;
}

class RealtimeCollaborationService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private activeUsers: Map<string, CollaborationUser> = new Map();
  private activityLog: CollaborationActivity[] = [];
  private listeners: Map<string, Set<(activity: CollaborationActivity) => void>> = new Map();

  subscribeToWorkspace(workspaceId: string, onActivity: (activity: CollaborationActivity) => void): () => void {
    const channelName = `workspace:${workspaceId}`;

    if (!this.listeners.has(channelName)) {
      this.listeners.set(channelName, new Set());
    }
    this.listeners.get(channelName)!.add(onActivity);

    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'evidence_syntheses'
        }, (payload) => {
          this.broadcastActivity({
            type: 'synthesis_updated',
            userId: 'system',
            userName: 'System',
            timestamp: new Date().toISOString(),
            data: payload.new
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'practice_translations',
          filter: 'status=eq.approved'
        }, (payload) => {
          this.broadcastActivity({
            type: 'translation_approved',
            userId: 'system',
            userName: 'System',
            timestamp: new Date().toISOString(),
            data: payload.new
          });
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'evidence_contradiction_log'
        }, (payload) => {
          this.broadcastActivity({
            type: 'contradiction_detected',
            userId: 'system',
            userName: 'System',
            timestamp: new Date().toISOString(),
            data: payload.new
          });
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'research_papers'
        }, (payload) => {
          this.broadcastActivity({
            type: 'paper_added',
            userId: 'system',
            userName: 'System',
            timestamp: new Date().toISOString(),
            data: payload.new
          });
        })
        .on('broadcast', { event: 'user_activity' }, (payload) => {
          this.handleUserActivity(payload.payload as CollaborationActivity);
        })
        .subscribe();

      this.channels.set(channelName, channel);
    }

    return () => {
      const listeners = this.listeners.get(channelName);
      if (listeners) {
        listeners.delete(onActivity);
        if (listeners.size === 0) {
          this.unsubscribeFromWorkspace(workspaceId);
        }
      }
    };
  },

  unsubscribeFromWorkspace(workspaceId: string): void {
    const channelName = `workspace:${workspaceId}`;
    const channel = this.channels.get(channelName);

    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
      this.listeners.delete(channelName);
    }
  },

  broadcastActivity(activity: CollaborationActivity): void {
    this.activityLog.push(activity);
    if (this.activityLog.length > 100) {
      this.activityLog.shift();
    }

    this.listeners.forEach((listeners) => {
      listeners.forEach((listener) => listener(activity));
    });
  },

  private handleUserActivity(activity: CollaborationActivity): void {
    this.broadcastActivity(activity);
  },

  sendUserActivity(workspaceId: string, activity: Omit<CollaborationActivity, 'timestamp'>): void {
    const channelName = `workspace:${workspaceId}`;
    const channel = this.channels.get(channelName);

    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'user_activity',
        payload: {
          ...activity,
          timestamp: new Date().toISOString()
        }
      });
    }
  },

  updateUserPresence(workspaceId: string, user: CollaborationUser): void {
    this.activeUsers.set(user.userId, user);

    setTimeout(() => {
      this.activeUsers.delete(user.userId);
    }, 30000);
  },

  getActiveUsers(): CollaborationUser[] {
    return Array.from(this.activeUsers.values());
  },

  getRecentActivity(limit: number = 20): CollaborationActivity[] {
    return this.activityLog.slice(-limit);
  },

  subscribeToSynthesis(synthesisId: string, onChange: (synthesis: any) => void): () => void {
    const channelName = `synthesis:${synthesisId}`;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'evidence_syntheses',
        filter: `id=eq.${synthesisId}`
      }, (payload) => {
        onChange(payload.new);
      })
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  },

  subscribeToTranslation(translationId: string, onChange: (translation: any) => void): () => void {
    const channelName = `translation:${translationId}`;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'practice_translations',
        filter: `id=eq.${translationId}`
      }, (payload) => {
        onChange(payload.new);
      })
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  },

  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
    this.listeners.clear();
    this.activeUsers.clear();
  }
}

export const realtimeCollaborationService = new RealtimeCollaborationService();
