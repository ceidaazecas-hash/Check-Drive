import React, { useState, useEffect } from 'react';
import {
  generateDefaultWeekRanges,
  DEFAULT_SEMESTER_START,
  format12HourTime,
  parseTimeString,
  formatDateInput
} from '../utils/weekDeadlineManager';

const COMMON_TIME_PRESETS = [
  '11:59 PM',
  '05:00 PM',
  '11:59 AM',
  '06:00 PM',
  '09:00 PM'
];

export default function DeadlineSettingsModal({
  isOpen,
  onClose,
  semesterStartDate,
  setSemesterStartDate,
  customDeadlines,
  setCustomDeadlines
}) {
  const [startDate, setStartDate] = useState(semesterStartDate || DEFAULT_SEMESTER_START);
  const [globalTime, setGlobalTime] = useState('11:59 PM');
  
  // State for 18 weeks with discrete date and time
  const [localWeeks, setLocalWeeks] = useState(() => {
    const baseWeeks = generateDefaultWeekRanges(semesterStartDate || DEFAULT_SEMESTER_START);
    if (customDeadlines && Object.keys(customDeadlines).length > 0) {
      return baseWeeks.map(w => {
        const savedIso = customDeadlines[w.name];
        if (savedIso) {
          const d = new Date(savedIso);
          return {
            ...w,
            deadlineIso: savedIso,
            dateString: formatDateInput(d),
            timeString: format12HourTime(d.getHours(), d.getMinutes())
          };
        }
        return w;
      });
    }
    return baseWeeks;
  });

  // Keep synced whenever opened
  useEffect(() => {
    if (isOpen) {
      const baseWeeks = generateDefaultWeekRanges(semesterStartDate || DEFAULT_SEMESTER_START);
      if (customDeadlines && Object.keys(customDeadlines).length > 0) {
        setLocalWeeks(baseWeeks.map(w => {
          const savedIso = customDeadlines[w.name];
          if (savedIso) {
            const d = new Date(savedIso);
            return {
              ...w,
              deadlineIso: savedIso,
              dateString: formatDateInput(d),
              timeString: format12HourTime(d.getHours(), d.getMinutes())
            };
          }
          return w;
        }));
      } else {
        setLocalWeeks(baseWeeks);
      }
      setStartDate(semesterStartDate || DEFAULT_SEMESTER_START);
    }
  }, [isOpen, semesterStartDate, customDeadlines]);

  if (!isOpen) return null;

  const handleStartDateChange = (newStartDateStr) => {
    setStartDate(newStartDateStr);
    const updatedWeeks = generateDefaultWeekRanges(newStartDateStr);
    
    // Preserve custom times if previously entered
    setLocalWeeks(updatedWeeks.map((w, idx) => {
      const existing = localWeeks[idx];
      const customTime = existing ? existing.timeString : globalTime;
      const parsedTime = parseTimeString(customTime);
      
      const dueD = new Date(w.endDate);
      dueD.setHours(parsedTime.hours, parsedTime.minutes, 59, 999);

      return {
        ...w,
        deadlineIso: dueD.toISOString(),
        dateString: formatDateInput(dueD),
        timeString: customTime
      };
    }));
  };

  const handleWeekDateChange = (weekName, newDateStr) => {
    setLocalWeeks(prev => prev.map(w => {
      if (w.name !== weekName) return w;
      const parsedTime = parseTimeString(w.timeString || '23:59');
      const [year, month, day] = newDateStr.split('-').map(Number);
      const newD = new Date(year, month - 1, day, parsedTime.hours, parsedTime.minutes, 59, 999);
      
      return {
        ...w,
        deadlineIso: newD.toISOString(),
        dateString: newDateStr
      };
    }));
  };

  const handleWeekTimeChange = (weekName, newTimeStr) => {
    setLocalWeeks(prev => prev.map(w => {
      if (w.name !== weekName) return w;
      const parsedTime = parseTimeString(newTimeStr);
      const d = new Date(w.deadlineIso || w.endDate);
      d.setHours(parsedTime.hours, parsedTime.minutes, 59, 999);
      
      return {
        ...w,
        deadlineIso: d.toISOString(),
        timeString: newTimeStr
      };
    }));
  };

  const handleApplyTimeToAll = (timeStr) => {
    setGlobalTime(timeStr);
    const parsed = parseTimeString(timeStr);

    setLocalWeeks(prev => prev.map(w => {
      const d = new Date(w.deadlineIso || w.endDate);
      d.setHours(parsed.hours, parsed.minutes, 59, 999);
      return {
        ...w,
        deadlineIso: d.toISOString(),
        timeString: timeStr
      };
    }));
  };

  const handleResetToDefaults = () => {
    setStartDate(DEFAULT_SEMESTER_START);
    setGlobalTime('11:59 PM');
    const defaultWeeks = generateDefaultWeekRanges(DEFAULT_SEMESTER_START);
    setLocalWeeks(defaultWeeks);
  };

  const handleSave = () => {
    const deadlineMap = {};
    localWeeks.forEach(w => {
      deadlineMap[w.name] = w.deadlineIso;
    });

    setSemesterStartDate(startDate);
    setCustomDeadlines(deadlineMap);
    localStorage.setItem('semester_start_date', startDate);
    localStorage.setItem('custom_week_deadlines', JSON.stringify(deadlineMap));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in duration-150 border-0 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border-0 font-bold"
        >
          &times;
        </button>

        {/* Header */}
        <div className="mb-4 text-center">
          <h3 className="text-lg font-black text-gray-900">Semester Schedule & Deadlines (Week 1 - 18)</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Set semester start date and due time for Late tracking.
          </p>
        </div>

        {/* Global Controls & Time Presets */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-3 border-0">
          
          {/* Row 1: Start Date & Reset */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-bold text-gray-700 whitespace-nowrap">
                Week 1 Start Date (Monday):
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="px-3 py-1.5 bg-white rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-google-blue border-0 shadow-2xs"
              />
            </div>

            <button
              type="button"
              onClick={handleResetToDefaults}
              className="text-xs text-gray-600 hover:text-gray-900 font-bold border-0"
            >
              Reset Default (Mon Jun 8, 2026 @ 11:59 PM)
            </button>
          </div>

          {/* Row 2: Global Due Time Presets & "Apply to All" */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-700">
                Default Due Time:
              </span>

              {COMMON_TIME_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyTimeToAll(preset)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border-0 shadow-2xs ${
                    globalTime === preset
                      ? 'bg-[#f6ad55] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {preset}
                </button>
              ))}

              {/* Custom text entry e.g. "11:59 pm" */}
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={globalTime}
                  onChange={(e) => setGlobalTime(e.target.value)}
                  placeholder="e.g. 11:59 pm"
                  className="w-24 px-2.5 py-1 bg-white rounded-xl text-xs font-bold text-gray-800 text-center focus:ring-1 focus:ring-google-blue border-0 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleApplyTimeToAll(globalTime)}
                  className="px-3 py-1 bg-google-blue hover:bg-google-hover text-white rounded-xl text-xs font-bold shadow-2xs border-0"
                  title="Apply entered time to all 18 weeks"
                >
                  Apply All
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Weekly Deadlines Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {localWeeks.map(w => (
              <div
                key={w.name}
                className="p-3 bg-gray-50 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs border-0"
              >
                <div>
                  <div className="font-black text-gray-900 text-xs">{w.name}</div>
                  <div className="text-[10px] text-gray-500 font-medium">{w.formattedRange} (Mon-Fri)</div>
                </div>

                <div className="flex items-center space-x-2">
                  
                  {/* Due Date Picker */}
                  <input
                    type="date"
                    value={w.dateString}
                    onChange={(e) => handleWeekDateChange(w.name, e.target.value)}
                    className="px-2 py-1 bg-white rounded-lg text-xs font-bold text-gray-800 focus:ring-1 focus:ring-google-blue border-0 shadow-2xs"
                  />

                  {/* Due Time Input */}
                  <input
                    type="text"
                    value={w.timeString}
                    onChange={(e) => handleWeekTimeChange(w.name, e.target.value)}
                    placeholder="11:59 PM"
                    className="w-24 px-2 py-1 bg-white rounded-lg text-xs font-bold text-gray-800 text-center focus:ring-1 focus:ring-google-blue border-0 shadow-2xs"
                    title="Enter time like 11:59 PM, 5:00 PM, etc."
                  />

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold border-0"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-google-blue hover:bg-google-hover text-white rounded-xl text-xs font-black shadow-xs border-0"
          >
            Apply Schedule & Deadlines
          </button>
        </div>

      </div>
    </div>
  );
}
