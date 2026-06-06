import { useState, useEffect } from 'react';
import { Users, Search, Plus, Phone, Mail, Calendar, ChevronRight, Filter, RefreshCw, UserCheck, CircleAlert as AlertCircle, Clock, Activity, X, Send, CircleCheck as CheckCircle, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  email: string;
  medical_record_number: string;
  status: string;
  clinic_name?: string;
  last_visit?: string;
  diagnosis?: string;
  assigned_provider?: string;
}

const DEMO_PATIENTS: Patient[] = [
  { id: '1', first_name: 'Jane', last_name: 'Smith', date_of_birth: '1985-04-12', phone: '(780) 555-0101', email: 'jane.smith@email.com', medical_record_number: 'MRN-10042', status: 'active', clinic_name: 'AIM South Commons', last_visit: '2026-03-14', diagnosis: 'Lower Back Pain', assigned_provider: 'Dr. Chen' },
  { id: '2', first_name: 'Mark', last_name: 'Johnson', date_of_birth: '1978-09-23', phone: '(780) 555-0102', email: 'mark.j@email.com', medical_record_number: 'MRN-10043', status: 'active', clinic_name: 'AIM Downtown', last_visit: '2026-03-10', diagnosis: 'Rotator Cuff Injury', assigned_provider: 'Dr. Patel' },
  { id: '3', first_name: 'Sara', last_name: 'Lee', date_of_birth: '1997-01-05', phone: '(780) 555-0103', email: 'sara.lee@email.com', medical_record_number: 'MRN-10044', status: 'active', clinic_name: 'AIM South Commons', last_visit: '2026-03-12', diagnosis: 'ACL Rehabilitation', assigned_provider: 'Dr. Williams' },
  { id: '4', first_name: 'Tom', last_name: 'Brown', date_of_birth: '1970-07-18', phone: '(780) 555-0104', email: 'tom.brown@email.com', medical_record_number: 'MRN-10045', status: 'active', clinic_name: 'AIM West', last_visit: '2026-03-11', diagnosis: 'Cervical Strain (MVA)', assigned_provider: 'Dr. Chen' },
  { id: '5', first_name: 'Alice', last_name: 'Park', date_of_birth: '1992-11-30', phone: '(780) 555-0105', email: 'alice.park@email.com', medical_record_number: 'MRN-10046', status: 'active', clinic_name: 'AIM Downtown', last_visit: '2026-03-13', diagnosis: 'Knee Osteoarthritis', assigned_provider: 'Dr. Patel' },
  { id: '6', first_name: 'Carlos', last_name: 'Reyes', date_of_birth: '1983-03-22', phone: '(780) 555-0106', email: 'carlos.r@email.com', medical_record_number: 'MRN-10047', status: 'discharged', clinic_name: 'AIM West', last_visit: '2026-03-10', diagnosis: 'WCB - Lumbar Strain', assigned_provider: 'Dr. Williams' },
  { id: '7', first_name: 'Linda', last_name: 'Evans', date_of_birth: '2001-06-14', phone: '(780) 555-0107', email: 'linda.e@email.com', medical_record_number: 'MRN-10048', status: 'active', clinic_name: 'AIM South Commons', last_visit: '2026-03-15', diagnosis: 'Soccer - ACL Tear', assigned_provider: 'Dr. Williams' },
  { id: '8', first_name: 'Ana', last_name: 'Fischer', date_of_birth: '1999-08-09', phone: '(780) 555-0108', email: 'ana.f@email.com', medical_record_number: 'MRN-10049', status: 'active', clinic_name: 'AIM Downtown', last_visit: '2026-03-09', diagnosis: 'Hockey - Shoulder Contusion', assigned_provider: 'Dr. Chen' },
  { id: '9', first_name: 'David', last_name: 'Kim', date_of_birth: '1965-12-01', phone: '(780) 555-0109', email: 'david.k@email.com', medical_record_number: 'MRN-10050', status: 'inactive', clinic_name: 'AIM West', last_visit: '2026-01-20', diagnosis: 'Hip Replacement Post-Op', assigned_provider: 'Dr. Patel' },
  { id: '10', first_name: 'Priya', last_name: 'Sharma', date_of_birth: '1990-02-17', phone: '(780) 555-0110', email: 'priya.s@email.com', medical_record_number: 'MRN-10051', status: 'active', clinic_name: 'AIM South Commons', last_visit: '2026-03-16', diagnosis: 'Pelvic Floor Dysfunction', assigned_provider: 'Dr. Chen' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active:    { label: 'Active',     color: 'bg-green-100 text-green-800',   dot: 'bg-green-500' },
  inactive:  { label: 'Inactive',   color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
  discharged:{ label: 'Discharged', color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400' },
  waitlist:  { label: 'Waitlist',   color: 'bg-amber-100 text-amber-800',   dot: 'bg-amber-500' },
  new:       { label: 'New',        color: 'bg-teal-100 text-teal-800',     dot: 'bg-teal-500' },
};

const APPOINTMENT_TYPES = ['Initial Assessment', 'Follow-up', 'Re-assessment', 'Discharge', 'Consultation'];
const TIME_SLOTS = ['8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'];

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

interface BookModalProps {
  patient: Patient;
  onClose: () => void;
}

function BookAppointmentModal({ patient, onClose }: BookModalProps) {
  const [date, setDate] = useState(getTodayStr());
  const [time, setTime] = useState(TIME_SLOTS[2]);
  const [type, setType] = useState(APPOINTMENT_TYPES[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await supabase.from('patient_appointments').insert({
        patient_id: patient.id,
        appointment_date: date,
        appointment_time: time,
        appointment_type: type,
        notes,
        status: 'scheduled',
      });
    } catch {
    } finally {
      setSaving(false);
      setDone(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Book Appointment</h2>
            <p className="text-sm text-gray-500">{patient.last_name}, {patient.first_name} &middot; {patient.medical_record_number}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Appointment Booked</h3>
            <p className="text-sm text-gray-500 mb-1">{type}</p>
            <p className="text-sm font-medium text-gray-700">{new Date(date + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at {time}</p>
            {patient.assigned_provider && (
              <p className="text-sm text-gray-500 mt-1">with {patient.assigned_provider}</p>
            )}
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Appointment Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {APPOINTMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  min={getTodayStr()}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Time</label>
                <select
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Any relevant notes for this appointment..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !date}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                {saving ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MessageModalProps {
  patient: Patient;
  onClose: () => void;
}

function SendMessageModal({ patient, onClose }: MessageModalProps) {
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const QUICK_MESSAGES = [
    'Reminder: You have an upcoming appointment.',
    'Your treatment plan has been updated. Please log in to review.',
    'Please confirm your appointment for tomorrow.',
    'Your clinician has left a note on your file.',
  ];

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await supabase.from('patient_messages').insert({
        patient_id: patient.id,
        channel,
        message_body: message,
        direction: 'outbound',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } catch {
    } finally {
      setSending(false);
      setDone(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Send Message</h2>
            <p className="text-sm text-gray-500">{patient.last_name}, {patient.first_name} &middot; {patient.medical_record_number}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Message Sent</h3>
            <p className="text-sm text-gray-500 mb-1">via {channel === 'sms' ? 'SMS' : 'Email'} to {channel === 'sms' ? patient.phone : patient.email}</p>
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Channel</label>
              <div className="grid grid-cols-2 gap-2">
                {(['sms', 'email'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setChannel(c)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      channel === c
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {c === 'sms' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    {c === 'sms' ? `SMS (${patient.phone || 'no phone'})` : 'Email'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Quick Messages</label>
              <div className="space-y-1.5">
                {QUICK_MESSAGES.map(q => (
                  <button
                    key={q}
                    onClick={() => setMessage(q)}
                    className="w-full text-left text-xs text-gray-600 px-3 py-2 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="Type your message..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{message.length} chars</p>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface Clinic {
  id: string;
  name: string;
}

interface NewPatientModalProps {
  onClose: () => void;
  onCreated: (patient: Patient) => void;
}

function NewPatientModal({ onClose, onCreated }: NewPatientModalProps) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [step, setStep] = useState<'form' | 'done'>(('form'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    clinic_id: '',
    address_line1: '',
    city: '',
    postal_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    status: 'active',
  });

  useEffect(() => {
    supabase.from('clinics').select('id, name').order('name').then(({ data }) => {
      if (data) setClinics(data);
    });
  }, []);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const generateMRN = () => `MRN-${Date.now().toString().slice(-5)}`;

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) { setError('First and last name are required.'); return; }
    if (!form.date_of_birth) { setError('Date of birth is required.'); return; }
    if (!form.clinic_id) { setError('Please select a clinic.'); return; }
    setSaving(true);
    setError('');
    const mrn = generateMRN();
    const { data, error: err } = await supabase.from('patients').insert({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      date_of_birth: form.date_of_birth,
      gender: form.gender || null,
      phone: form.phone || null,
      email: form.email || null,
      clinic_id: form.clinic_id,
      address_line1: form.address_line1 || null,
      city: form.city || null,
      postal_code: form.postal_code || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      medical_record_number: mrn,
      status: form.status,
    }).select('id, first_name, last_name, date_of_birth, phone, email, medical_record_number, status').single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    const newPatient: Patient = {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth,
      phone: data.phone,
      email: data.email,
      medical_record_number: data.medical_record_number,
      status: data.status,
      clinic_name: clinics.find(c => c.id === form.clinic_id)?.name,
    };
    setCreatedPatient(newPatient);
    setStep('done');
    onCreated(newPatient);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">New Patient</h2>
              <p className="text-xs text-gray-400 mt-0.5">Register a new patient record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'done' && createdPatient ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Patient Registered</h3>
            <p className="text-sm text-gray-700 font-medium">{createdPatient.last_name}, {createdPatient.first_name}</p>
            <p className="text-sm text-gray-400 mt-0.5">{createdPatient.medical_record_number}</p>
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Personal Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">First Name <span className="text-red-500">*</span></label>
                    <input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="First name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Last Name <span className="text-red-500">*</span></label>
                    <input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Last name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                    <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Gender</label>
                    <select value={form.gender} onChange={e => set('gender', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Phone</label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(780) 555-0100" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="patient@email.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Address</label>
                    <input value={form.address_line1} onChange={e => set('address_line1', e.target.value)} placeholder="Street address" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">City</label>
                    <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Edmonton" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Postal Code</label>
                    <input value={form.postal_code} onChange={e => set('postal_code', e.target.value)} placeholder="T5A 0A1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Clinic & Status</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Clinic <span className="text-red-500">*</span></label>
                    <select value={form.clinic_id} onChange={e => set('clinic_id', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select clinic</option>
                      {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Status</label>
                    <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="active">Active</option>
                      <option value="new">New</option>
                      <option value="waitlist">Waitlist</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Emergency Contact</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Name</label>
                    <input value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="Contact name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Phone</label>
                    <input value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} placeholder="(780) 555-0100" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {saving ? 'Registering...' : 'Register Patient'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PatientsView() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);
  const [bookingPatient, setBookingPatient] = useState<Patient | null>(null);
  const [messagingPatient, setMessagingPatient] = useState<Patient | null>(null);
  const [showNewPatient, setShowNewPatient] = useState(false);

  useEffect(() => { loadPatients(); }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id, first_name, last_name, date_of_birth, phone, email,
          medical_record_number, status,
          clinic:clinic_id ( name )
        `)
        .order('last_name', { ascending: true })
        .limit(100);

      if (error || !data || data.length === 0) {
        setPatients(DEMO_PATIENTS);
      } else {
        setPatients(data.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          first_name: r.first_name as string,
          last_name: r.last_name as string,
          date_of_birth: r.date_of_birth as string,
          phone: r.phone as string,
          email: r.email as string,
          medical_record_number: r.medical_record_number as string,
          status: r.status as string,
          clinic_name: (r.clinic as Record<string, string> | null)?.name,
        })));
      }
    } catch {
      setPatients(DEMO_PATIENTS);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      p.medical_record_number?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.diagnosis?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount     = patients.filter(p => p.status === 'active').length;
  const newCount        = patients.filter(p => p.status === 'new').length;
  const dischargedCount = patients.filter(p => p.status === 'discharged').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-500 mt-1">Patient roster and profile management</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadPatients}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowNewPatient(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Patient
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Patients', value: activeCount, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'New This Month', value: newCount, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Discharged', value: dischargedCount, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`${bg} p-3 rounded-lg`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, MRN, email, phone, or diagnosis..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">{filtered.length} patients</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="text-sm text-gray-500">Loading patients...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No patients found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(patient => {
              const cfg = STATUS_CONFIG[patient.status] ?? STATUS_CONFIG.inactive;
              const isSelected = selected?.id === patient.id;
              return (
                <div key={patient.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(isSelected ? null : patient)}
                    onKeyDown={e => e.key === 'Enter' && setSelected(isSelected ? null : patient)}
                    className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">
                            {patient.last_name}, {patient.first_name}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-0.5 text-xs text-gray-500">
                          <span>{patient.medical_record_number}</span>
                          {patient.date_of_birth && (
                            <span>{calculateAge(patient.date_of_birth)} yrs</span>
                          )}
                          {patient.diagnosis && (
                            <span className="truncate max-w-xs">{patient.diagnosis}</span>
                          )}
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-6 text-sm text-gray-500 flex-shrink-0">
                        {patient.clinic_name && (
                          <span className="text-xs text-gray-400">{patient.clinic_name}</span>
                        )}
                        {patient.assigned_provider && (
                          <span className="text-xs text-gray-500">{patient.assigned_provider}</span>
                        )}
                        {patient.last_visit && (
                          <span className="text-xs text-gray-400">
                            Last: {new Date(patient.last_visit).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {isSelected && (
                    <div className="px-5 pb-4 ml-14 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-blue-50">
                      {[
                        { icon: Phone, label: 'Phone', value: patient.phone },
                        { icon: Mail, label: 'Email', value: patient.email },
                        { icon: Calendar, label: 'DOB', value: patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                        { icon: Users, label: 'Provider', value: patient.assigned_provider || '—' },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="bg-white rounded-lg border border-gray-200 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
                          </div>
                          <p className="text-gray-900 font-medium text-sm truncate">{value || '—'}</p>
                        </div>
                      ))}
                      <div className="col-span-2 md:col-span-4 flex gap-2 mt-1">
                        <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                          View Full Profile
                        </button>
                        <button
                          onClick={() => setBookingPatient(patient)}
                          className="px-3 py-1.5 border border-gray-200 bg-white text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                          Book Appointment
                        </button>
                        <button
                          onClick={() => setMessagingPatient(patient)}
                          className="px-3 py-1.5 border border-gray-200 bg-white text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                          Send Message
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {bookingPatient && (
        <BookAppointmentModal patient={bookingPatient} onClose={() => setBookingPatient(null)} />
      )}
      {messagingPatient && (
        <SendMessageModal patient={messagingPatient} onClose={() => setMessagingPatient(null)} />
      )}
      {showNewPatient && (
        <NewPatientModal
          onClose={() => setShowNewPatient(false)}
          onCreated={newPt => setPatients(prev => [newPt, ...prev])}
        />
      )}
    </div>
  );
}
