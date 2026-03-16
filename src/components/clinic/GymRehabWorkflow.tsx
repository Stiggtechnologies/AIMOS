import React, { useState } from 'react';
import { Dumbbell, Clock, User, CircleCheck as CheckCircle2, Activity, TrendingUp, CircleAlert as AlertCircle } from 'lucide-react';

interface GymSession {
  patientName: string;
  sessionDate: string;
  checkInTime: string;
  checkOutTime?: string;
  sessionFocus: string;
  exercisesCompleted: string[];
  painLevel: number;
}

export default function GymRehabWorkflow() {
  const [activeSessions, setActiveSessions] = useState<GymSession[]>([
    {
      patientName: 'John Smith',
      sessionDate: new Date().toISOString().split('T')[0],
      checkInTime: '10:30 AM',
      sessionFocus: 'Lower body strength progression',
      exercisesCompleted: ['Squats 3x10', 'Leg press 3x12'],
      painLevel: 2
    }
  ]);

  const getPainLevelColor = (level: number) => {
    if (level <= 2) return 'text-green-600 bg-green-100';
    if (level <= 5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Dumbbell className="w-7 h-7 text-blue-600" />
            Gym-Based Rehab Sessions
          </h2>
          <p className="text-gray-600 mt-1">
            Monitor supervised gym rehabilitation progressions
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Check In Patient
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{activeSessions.length}</span>
          </div>
          <div className="text-sm text-gray-600">Active Sessions</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">12</span>
          </div>
          <div className="text-sm text-gray-600">Sessions Today</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Dumbbell className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">85%</span>
          </div>
          <div className="text-sm text-gray-600">Avg Compliance</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Active Gym Sessions</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {activeSessions.map((session, index) => (
            <div key={index} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{session.patientName}</h4>
                      <p className="text-sm text-gray-600">{session.sessionFocus}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Checked in: {session.checkInTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span>{session.exercisesCompleted.length} exercises completed</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {session.exercisesCompleted.map((exercise, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded"
                      >
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                        {exercise}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPainLevelColor(session.painLevel)}`}>
                    Pain: {session.painLevel}/10
                  </div>
                  <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    Check Out
                  </button>
                </div>
              </div>
            </div>
          ))}

          {activeSessions.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2">No Active Sessions</p>
              <p className="text-sm">Check in a patient to start a gym rehab session</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">Gym Access Integration</h4>
            <p className="text-sm text-blue-700">
              Patients with gym-based rehab prescriptions automatically receive access to the Evolve Strength South Commons facility during supervised sessions. Track progression, adherence, and return-to-sport readiness.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
