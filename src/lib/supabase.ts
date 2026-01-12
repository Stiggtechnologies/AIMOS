import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? 'loaded' : 'MISSING');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'loaded' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase client initialized');

export type Database = {
  public: {
    Tables: {
      jobs: any;
      candidates: any;
      applications: any;
      interviews: any;
      agents: any;
      agent_events: any;
      agent_memory: any;
      kpis: any;
      tasks: any;
      workflows: any;
    };
  };
};
