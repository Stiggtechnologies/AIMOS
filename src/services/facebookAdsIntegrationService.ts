import { supabase } from '../lib/supabase';

export interface FacebookAdsConfig {
  webhook_url: string;
  verify_token: string;
  is_configured: boolean;
  last_lead_received_at?: string;
  total_leads_received: number;
}

export interface FacebookLeadStats {
  today: number;
  this_week: number;
  this_month: number;
  avg_cost_per_lead: number;
  conversion_rate: number;
}

export const facebookAdsIntegrationService = {
  /**
   * Get the Facebook Ads webhook configuration
   */
  async getConfig(): Promise<FacebookAdsConfig> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const webhookUrl = `${supabaseUrl}/functions/v1/facebook-leads-webhook`;
    
    // Check if Facebook lead source exists and is configured
    const { data: leadSource } = await supabase
      .from('crm_lead_sources')
      .select('*')
      .eq('slug', 'facebook-ads')
      .maybeSingle();
    
    if (!leadSource) {
      return {
        webhook_url: webhookUrl,
        verify_token: 'aimos_fb_leads',
        is_configured: false,
        total_leads_received: 0,
      };
    }
    
    // Get stats on Facebook leads
    const { data: leads } = await supabase
      .from('crm_leads')
      .select('created_at')
      .eq('lead_source_id', leadSource.id)
      .order('created_at', { ascending: false });
    
    return {
      webhook_url: webhookUrl,
      verify_token: 'aimos_fb_leads',
      is_configured: true,
      last_lead_received_at: leads?.[0]?.created_at,
      total_leads_received: leads?.length || 0,
    };
  },

  /**
   * Get Facebook lead statistics
   */
  async getLeadStats(): Promise<FacebookLeadStats> {
    const { data: leadSource } = await supabase
      .from('crm_lead_sources')
      .select('id')
      .eq('slug', 'facebook-ads')
      .maybeSingle();
    
    if (!leadSource) {
      return {
        today: 0,
        this_week: 0,
        this_month: 0,
        avg_cost_per_lead: 0,
        conversion_rate: 0,
      };
    }
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get leads by period
    const { data: allLeads } = await supabase
      .from('crm_leads')
      .select('created_at, status')
      .eq('lead_source_id', leadSource.id);
    
    const leads = allLeads || [];
    
    const today = leads.filter(
      l => new Date(l.created_at) >= todayStart
    ).length;
    
    const thisWeek = leads.filter(
      l => new Date(l.created_at) >= weekStart
    ).length;
    
    const thisMonth = leads.filter(
      l => new Date(l.created_at) >= monthStart
    ).length;
    
    const converted = leads.filter(
      l => l.status === 'converted' || l.status === 'booked'
    ).length;
    
    const conversion_rate = leads.length > 0
      ? (converted / leads.length) * 100
      : 0;
    
    return {
      today,
      this_week: thisWeek,
      this_month: thisMonth,
      avg_cost_per_lead: 0, // TODO: Calculate from ad spend data
      conversion_rate,
    };
  },

  /**
   * Test the webhook endpoint
   */
  async testWebhook(): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();
    
    const testPayload = {
      id: `test_${Date.now()}`,
      first_name: 'Test',
      last_name: 'Lead',
      email: 'test@example.com',
      phone_number: '+15551234567',
      campaign_name: 'Test Campaign',
      ad_name: 'Test Ad',
      form_name: 'Test Form',
    };
    
    try {
      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          success: true,
          message: `Test lead created successfully with ID: ${result.lead_id}`,
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to create test lead',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  /**
   * Get recent Facebook leads
   */
  async getRecentLeads(limit: number = 10) {
    const { data: leadSource } = await supabase
      .from('crm_lead_sources')
      .select('id')
      .eq('slug', 'facebook-ads')
      .maybeSingle();
    
    if (!leadSource) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('crm_leads')
      .select(`
        *,
        service_line:crm_service_lines(name),
        clinic:clinics(name)
      `)
      .eq('lead_source_id', leadSource.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Generate setup instructions for Zapier integration
   */
  getZapierInstructions(): string {
    const config = this.getConfig();
    return `
# Facebook Ads → AIMOS Integration via Zapier

## Step 1: Create Zap
1. Go to https://zapier.com/app/zaps
2. Click "Create Zap"
3. Name it: "Facebook Lead Ads → AIMOS"

## Step 2: Configure Trigger
1. Search for "Facebook Lead Ads"
2. Choose "New Lead"
3. Connect your Facebook account
4. Select your Facebook Page
5. Select your Lead Form
6. Test the trigger

## Step 3: Configure Action
1. Search for "Webhooks by Zapier"
2. Choose "POST"
3. **URL:** ${config.then(c => c.webhook_url)}
4. **Payload Type:** JSON
5. **Data:** Map Facebook fields:

\`\`\`json
{
  "id": "{{lead_id}}",
  "first_name": "{{first_name}}",
  "last_name": "{{last_name}}",
  "email": "{{email}}",
  "phone_number": "{{phone}}",
  "campaign_name": "{{campaign_name}}",
  "ad_name": "{{ad_name}}",
  "form_name": "{{form_name}}"
}
\`\`\`

## Step 4: Test & Activate
1. Click "Test & Continue"
2. Check AIMOS CRM for the test lead
3. Turn on your Zap!

## Done!
New Facebook leads will now automatically appear in AIMOS CRM with high priority status.
    `.trim();
  },
};
