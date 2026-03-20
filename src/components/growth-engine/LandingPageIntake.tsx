import React, { useState } from 'react';
import { CircleCheck as CheckCircle, Phone, Mail, User, ChevronRight, CircleAlert as AlertCircle, Loader as Loader2, MapPin, Clock } from 'lucide-react';
import { growthEngineService } from '../../services/growthEngineService';

export type LandingPageSlug =
  | 'book-physio'
  | 'custom-orthotics'
  | 'workplace-injury'
  | 'motor-vehicle-accident-rehab'
  | 'concussion'
  | 'employers'
  | 'careers';

interface PageConfig {
  slug: LandingPageSlug;
  title: string;
  headline: string;
  subheadline: string;
  funnel: string;
  channel_hint: string;
  urgency: string;
  valueEst: number;
  gradient: string;
  features: string[];
  cta: string;
  imageBg: string;
}

const PAGE_CONFIG: Record<LandingPageSlug, PageConfig> = {
  'book-physio': {
    slug: 'book-physio',
    title: 'Book a Physiotherapy Assessment',
    headline: 'Get Back to What You Love — Faster',
    subheadline: 'Expert physiotherapy at AIM. Same-week appointments available.',
    funnel: 'physio',
    channel_hint: 'google-ads',
    urgency: 'high',
    valueEst: 450,
    gradient: 'from-blue-600 to-blue-700',
    features: ['Certified physiotherapists', 'WCB & insurance accepted', 'Same-week appointments', 'All injury types treated'],
    cta: 'Book My Free Consultation',
    imageBg: 'https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  'custom-orthotics': {
    slug: 'custom-orthotics',
    title: 'Custom Orthotics — Alberta',
    headline: 'Step Into Pain-Free Living',
    subheadline: 'Precision-fitted custom orthotics. Assessment included.',
    funnel: 'orthotics',
    channel_hint: 'google-ads',
    urgency: 'medium',
    valueEst: 650,
    gradient: 'from-teal-600 to-teal-700',
    features: ['Custom-fitted to your foot', 'Covered by most benefit plans', 'Biomechanical assessment included', 'Ready in 2–3 weeks'],
    cta: 'Get My Free Assessment',
    imageBg: 'https://images.pexels.com/photos/4386464/pexels-photo-4386464.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  'workplace-injury': {
    slug: 'workplace-injury',
    title: 'WCB Workplace Injury Rehab',
    headline: 'Injured at Work? We Handle the Rest',
    subheadline: 'Direct billing to WCB. Get the care you deserve without the paperwork.',
    funnel: 'wcb',
    channel_hint: 'google-ads',
    urgency: 'high',
    valueEst: 900,
    gradient: 'from-orange-600 to-orange-700',
    features: ['Direct WCB billing', 'Injury documentation support', 'Return-to-work planning', 'Priority scheduling'],
    cta: 'Start My WCB Claim',
    imageBg: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  'motor-vehicle-accident-rehab': {
    slug: 'motor-vehicle-accident-rehab',
    title: 'MVA Rehab — Motor Vehicle Accident',
    headline: 'Auto Accident? Your Recovery Starts Here',
    subheadline: 'Direct billing to your insurer. No out-of-pocket costs.',
    funnel: 'mva',
    channel_hint: 'google-ads',
    urgency: 'high',
    valueEst: 900,
    gradient: 'from-red-600 to-red-700',
    features: ['Direct insurance billing', 'Whiplash & soft tissue specialists', 'Legal documentation available', 'Flexible scheduling'],
    cta: 'Start My MVA Claim',
    imageBg: 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  'concussion': {
    slug: 'concussion',
    title: 'Concussion Rehabilitation',
    headline: 'Concussion Recovery. Done Right.',
    subheadline: 'Evidence-based concussion protocols. Sport & non-sport.',
    funnel: 'concussion',
    channel_hint: 'google-ads',
    urgency: 'high',
    valueEst: 750,
    gradient: 'from-rose-600 to-rose-700',
    features: ['Certified concussion specialists', 'Return-to-sport protocols', 'Cognitive & vestibular rehab', 'School & work notes provided'],
    cta: 'Book Concussion Assessment',
    imageBg: 'https://images.pexels.com/photos/6551172/pexels-photo-6551172.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  'employers': {
    slug: 'employers',
    title: 'Employer & Corporate Programs',
    headline: 'Invest in Your Team\'s Health',
    subheadline: 'Reduced sick days. Lower WCB premiums. Healthier workforce.',
    funnel: 'employer',
    channel_hint: 'linkedin',
    urgency: 'medium',
    valueEst: 2500,
    gradient: 'from-sky-600 to-sky-700',
    features: ['On-site injury prevention', 'Employee health assessments', 'WCB claims management', 'Group orthotics programs'],
    cta: 'Request Employer Info Package',
    imageBg: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  'careers': {
    slug: 'careers',
    title: 'Join the AIM Team',
    headline: 'Build Your Career at AIM',
    subheadline: 'We\'re hiring physiotherapists, kinesiologists, and support staff across Alberta.',
    funnel: 'general',
    channel_hint: 'linkedin',
    urgency: 'low',
    valueEst: 0,
    gradient: 'from-emerald-600 to-emerald-700',
    features: ['Competitive salaries', 'Mentorship programs', 'Growth opportunities', 'Flexible scheduling'],
    cta: 'Apply Now',
    imageBg: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
};

function getUTMParams() {
  if (typeof window === 'undefined') return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source:   p.get('utm_source')   ?? '',
    utm_medium:   p.get('utm_medium')   ?? '',
    utm_campaign: p.get('utm_campaign') ?? '',
    utm_content:  p.get('utm_content')  ?? '',
    gclid:        p.get('gclid')        ?? '',
    fbclid:       p.get('fbclid')       ?? '',
  };
};

function inferChannel(config: PageConfig, utmParams: ReturnType<typeof getUTMParams>): string {
  if (utmParams.utm_source) {
    const s = utmParams.utm_source.toLowerCase();
    if (s.includes('google')) return utmParams.gclid ? 'google-ads' : 'google-business-profile';
    if (s.includes('facebook') || s.includes('fb')) return 'facebook-ads';
    if (s.includes('instagram') || s.includes('ig')) return 'instagram';
    if (s.includes('tiktok')) return 'tiktok';
    if (s.includes('linkedin')) return 'linkedin';
    if (s.includes('organic') || s.includes('seo')) return 'website-organic';
  }
  if (utmParams.gclid) return 'google-ads';
  if (utmParams.fbclid) return 'facebook-ads';
  return config.channel_hint;
}

interface Props {
  slug: LandingPageSlug;
  onLeadCreated?: (leadId: string) => void;
}

export const LandingPageIntake: React.FC<Props> = ({ slug, onLeadCreated }) => {
  const config = PAGE_CONFIG[slug];
  const [utmParams] = useState(getUTMParams);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', notes: '' });
  const [step, setStep] = useState<'form' | 'submitting' | 'success' | 'error'>('form');
  const [error, setError] = useState('');

  const channel_source = inferChannel(config, utmParams);

  const submit = async () => {
    if (!form.first_name.trim() || !form.phone.trim()) {
      setError('First name and phone are required.');
      return;
    }
    setError('');
    setStep('submitting');
    try {
      const lead = await growthEngineService.createLead({
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        phone:      form.phone.trim(),
        email:      form.email.trim() || undefined,
        channel_source,
        funnel_type: config.funnel,
        urgency_level: config.urgency,
        intent_confidence: 'high',
        lead_value_estimate: config.valueEst,
        notes: [
          form.notes.trim(),
          utmParams.utm_campaign ? `Campaign: ${utmParams.utm_campaign}` : '',
          utmParams.utm_content  ? `Content: ${utmParams.utm_content}` : '',
          utmParams.gclid        ? `GCLID: ${utmParams.gclid}` : '',
          utmParams.fbclid       ? `FBCLID: ${utmParams.fbclid}` : '',
        ].filter(Boolean).join(' | '),
      });
      setStep('success');
      onLeadCreated?.(lead.id);
    } catch {
      setStep('error');
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
          <p className="text-gray-500 text-sm">
            Thanks {form.first_name}! A member of the AIM team will reach out within 30 minutes during business hours.
          </p>
          <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            Prefer to call? (780) 469-4IM
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight: 300 }}>
        <img src={config.imageBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-85`} />
        <div className="relative z-10 px-6 py-16 md:px-16 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <img src="/aim-logo-28oct18-resized.jpg" alt="AIM" className="h-8 rounded" />
            <span className="text-white/80 text-sm font-medium">Alberta Injury Management</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3">
            {config.headline}
          </h1>
          <p className="text-white/80 text-lg max-w-xl">{config.subheadline}</p>
          <div className="flex items-center gap-4 mt-6 flex-wrap">
            {config.features.slice(0, 2).map(f => (
              <span key={f} className="flex items-center gap-1.5 text-white/90 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-white" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form + Trust */}
      <div className="max-w-5xl mx-auto px-6 md:px-16 py-10 grid md:grid-cols-2 gap-10">
        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{config.cta}</h2>
          <p className="text-xs text-gray-400 mb-6 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Average response time: under 30 minutes
          </p>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                <div className="relative">
                  <User className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={form.first_name}
                    onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
                    placeholder="Jane"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                <input
                  value={form.last_name}
                  onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
                  placeholder="Smith"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number *</label>
              <div className="relative">
                <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 780 555 0100"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email (optional)</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="jane@example.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {slug === 'careers' ? 'Role you\'re interested in' : 'Tell us briefly about your situation (optional)'}
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={3}
                placeholder={slug === 'careers' ? 'e.g. Physiotherapist, South Edmonton...' : 'e.g. Lower back pain after car accident, 3 weeks ago...'}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>

            <button
              onClick={submit}
              disabled={step === 'submitting'}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white shadow-md transition-all
                bg-gradient-to-r ${config.gradient} hover:opacity-90 disabled:opacity-60`}
            >
              {step === 'submitting' ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              ) : (
                <>{config.cta} <ChevronRight className="h-4 w-4" /></>
              )}
            </button>

            {step === 'error' && (
              <p className="text-xs text-red-500 text-center">
                Something went wrong. Please call us at (780) 469-4IM.
              </p>
            )}

            <p className="text-xs text-gray-400 text-center">
              No commitment required. Your info is private and secure.
            </p>
          </div>
        </div>

        {/* Trust Panel */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Why Choose AIM?</h3>
            <div className="space-y-3">
              {config.features.map(f => (
                <div key={f} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <CheckCircle className="h-3.5 w-3.5 text-white" />
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{f}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-gray-800">Our Clinics</h4>
            {[
              { name: 'South Edmonton', address: '4550 Calgary Trail NW', phone: '(780) 469-4467' },
              { name: 'West Edmonton', address: '17010 90 Ave NW', phone: '(780) 484-4467' },
              { name: 'Sherwood Park', address: '100 Ordze Ave', phone: '(780) 467-4467' },
            ].map(loc => (
              <div key={loc.name} className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{loc.name}</p>
                  <p className="text-xs text-gray-500">{loc.address} · {loc.phone}</p>
                </div>
              </div>
            ))}
          </div>

          {utmParams.utm_source && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-600">
              Source: {utmParams.utm_source}
              {utmParams.utm_campaign ? ` · Campaign: ${utmParams.utm_campaign}` : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const LandingPageGallery: React.FC<{ onSelect: (slug: LandingPageSlug) => void }> = ({ onSelect }) => (
  <div className="min-h-screen bg-gray-50/50">
    <div className="bg-white border-b border-gray-100 px-8 py-5">
      <h1 className="text-xl font-bold text-gray-900">Landing Pages</h1>
      <p className="text-xs text-gray-500 mt-0.5">UTM-aware intake forms for each service line & channel</p>
    </div>
    <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Object.values(PAGE_CONFIG).map(cfg => (
        <div key={cfg.slug} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className={`h-28 bg-gradient-to-br ${cfg.gradient} flex items-end p-4`}>
            <h3 className="text-white font-bold text-sm leading-tight">{cfg.title}</h3>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed">{cfg.subheadline}</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">/{cfg.slug}</span>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{cfg.funnel}</span>
              {cfg.valueEst > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                  ~${cfg.valueEst}
                </span>
              )}
            </div>
            <button
              onClick={() => onSelect(cfg.slug)}
              className={`w-full py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r ${cfg.gradient} hover:opacity-90 transition-opacity`}
            >
              Preview Form
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);
