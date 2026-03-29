// Session tracking utilities for AIMOS
// Use: import { trackDownload, trackCopy } from '../lib/sessionTracker';

import { supabase } from './supabase';

async function getIP(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}

export async function trackDownload(userId: string, email: string, fileName: string, pageUrl?: string) {
  try {
    const ip = await getIP();
    await supabase.from('user_sessions').insert({
      user_id: userId,
      email: email,
      ip_address: ip,
      user_agent: navigator.userAgent,
      page_url: pageUrl || window.location.href,
      action_type: 'download',
      // Note: Could add metadata column for file name in future
    });
  } catch (error) {
    console.error('Failed to track download:', error);
  }
}

export async function trackCopy(userId: string, email: string, contentType: string, pageUrl?: string) {
  try {
    const ip = await getIP();
    await supabase.from('user_sessions').insert({
      user_id: userId,
      email: email,
      ip_address: ip,
      user_agent: navigator.userAgent,
      page_url: pageUrl || window.location.href,
      action_type: 'copy',
    });
  } catch (error) {
    console.error('Failed to track copy:', error);
  }
}

export async function trackPageView(userId: string, email: string, pageUrl?: string) {
  try {
    const ip = await getIP();
    await supabase.from('user_sessions').insert({
      user_id: userId,
      email: email,
      ip_address: ip,
      user_agent: navigator.userAgent,
      page_url: pageUrl || window.location.href,
      action_type: 'view',
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}