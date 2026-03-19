import { useState, useEffect } from 'react';
import { Users, Search, Plus, Phone, Mail, Calendar, ChevronRight, Filter, RefreshCw, UserCheck, CircleAlert as AlertCircle, Clock, Activity } from 'lucide-react';
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

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function PatientsView() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);

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

  const activeCount    = patients.filter(p => p.status === 'active').length;
  const newCount       = patients.filter(p => p.status === 'new').length;
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
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
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
              return (
                <button
                  key={patient.id}
                  onClick={() => setSelected(selected?.id === patient.id ? null : patient)}
                  className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors ${selected?.id === patient.id ? 'bg-blue-50' : ''}`}
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
                    <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${selected?.id === patient.id ? 'rotate-90' : ''}`} />
                  </div>

                  {selected?.id === patient.id && (
                    <div className="mt-4 ml-14 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm" onClick={e => e.stopPropagation()}>
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
                        <button className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                          Book Appointment
                        </button>
                        <button className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                          Send Message
                        </button>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
