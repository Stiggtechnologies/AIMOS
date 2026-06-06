import { useState, useEffect } from 'react';
import {
  Mic,
  Pause,
  Square,
  User,
  Calendar,
  Clock,
  Building2,
} from 'lucide-react';

export type CaptureStatus = 'not_started' | 'recording' | 'paused' | 'stopped';
export type EncounterType = 'initial' | 'followup' | 'reassessment' | 'discharge';
export type EncounterModality = 'in_person' | 'virtual' | 'phone';

interface EncounterHeaderProps {
  encounterId: string;
  patientId: string;
  patientName: string;
  encounterType: EncounterType;
  modality: EncounterModality;
  captureStatus: CaptureStatus;
  scheduledStart?: string;
  clinicName: string;
  onStartCapture?: () => void;
  onPauseCapture?: () => void;
  onStopCapture?: () => void;
}

const encounterTypeLabels: Record<EncounterType, string> = {
  initial: 'Initial Assessment',
  followup: 'Follow-up',
  reassessment: 'Reassessment',
  discharge: 'Discharge Summary',
};

const modalityLabels: Record<EncounterModality, string> = {
  in_person: 'In-Person',
  virtual: 'Virtual',
  phone: 'Phone',
};

const statusColors: Record<CaptureStatus, string> = {
  not_started: 'bg-slate-600',
  recording: 'bg-red-600',
  paused: 'bg-amber-500',
  stopped: 'bg-emerald-600',
};

export function EncounterHeader({
  encounterId,
  patientId,
  patientName,
  encounterType,
  modality,
  captureStatus,
  scheduledStart,
  clinicName,
  onStartCapture,
  onPauseCapture,
  onStopCapture,
}: EncounterHeaderProps) {
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (captureStatus === 'recording') {
      setIsTimerRunning(true);
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } else if (captureStatus === 'paused') {
      setIsTimerRunning(false);
      if (interval) clearInterval(interval);
    } else if (captureStatus === 'stopped' || captureStatus === 'not_started') {
      setIsTimerRunning(false);
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [captureStatus]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatScheduledTime = (isoString?: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Encounter Type & Modality */}
      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
          {encounterTypeLabels[encounterType]}
        </span>
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/50">
          {modalityLabels[modality]}
        </span>
      </div>

      {/* Capture Status & Timer */}
      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 text-xs font-semibold rounded-full text-white flex items-center gap-2 ${statusColors[captureStatus]}`}
          >
            {captureStatus === 'recording' && (
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
            {captureStatus === 'not_started' && 'Not Started'}
            {captureStatus === 'recording' && 'Recording'}
            {captureStatus === 'paused' && 'Paused'}
            {captureStatus === 'stopped' && 'Stopped'}
          </span>
        </div>
        
        {/* Timer Display */}
        <div className="font-mono text-xl font-bold text-slate-200 tabular-nums">
          {formatTime(timer)}
        </div>
      </div>

      {/* Capture Controls */}
      <div className="flex gap-2">
        <button
          onClick={onStartCapture}
          disabled={captureStatus !== 'not_started'}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
            ${captureStatus === 'not_started'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
        >
          <Mic className="w-4 h-4" />
          Start
        </button>
        
        <button
          onClick={onPauseCapture}
          disabled={captureStatus !== 'recording'}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
            ${captureStatus === 'recording'
              ? 'bg-amber-500 hover:bg-amber-400 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
        >
          <Pause className="w-4 h-4" />
          Pause
        </button>
        
        <button
          onClick={onStopCapture}
          disabled={captureStatus === 'stopped' || captureStatus === 'not_started'}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
            ${captureStatus !== 'stopped' && captureStatus !== 'not_started'
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
        >
          <Square className="w-4 h-4" />
          Stop
        </button>
      </div>

      {/* Patient Info */}
      <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-700/50 rounded-lg">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">
              {patientName}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">{clinicName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled Time */}
      {scheduledStart && (
        <div className="flex items-center gap-2 text-sm text-slate-400 p-3 bg-slate-800/20 rounded-lg">
          <Calendar className="w-4 h-4" />
          <span>Scheduled: {formatScheduledTime(scheduledStart)}</span>
        </div>
      )}

      {/* Encounter ID Reference */}
      <div className="text-xs text-slate-500 text-center">
        ID: {encounterId.slice(0, 8)}...
      </div>
    </div>
  );
}

export default EncounterHeader;
