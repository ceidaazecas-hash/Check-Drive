import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Check, RotateCcw, Zap } from 'lucide-react';
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

  // Change semester start date
  const handleStartDateChange = (newDateStr) => {
    setStartDate(newDateStr);
    const { hours, minutes } = parseTimeString(globalTime);
    const newBaseWeeks = generateDefaultWeekRanges(newDateStr, hours, minutes);
    setLocalWeeks(newBaseWeeks);
  };

  // Apply a time to all 18 weeks at once
  const handleApplyTimeToAll = (targetTimeStr) => {
    setGlobalTime(targetTimeStr);
    const { hours, minutes } = parseTimeString(targetTimeStr);

    setLocalWeeks(prev => prev.map(w => {
      const dateParts = w.dateString.split('-');
      const d = new Date(
        parseInt(dateParts[0], 10),
        parseInt(dateParts[1], 10) - 1,
        parseInt(dateParts[2], 10),
        hours,
        minutes,
        59,
        999
      );
      return {
        ...w,
        deadlineIso: d.toISOString(),
        timeString: format12HourTime(hours, minutes)
      };
    }));
  };

  // Change specific week date
  const handleWeekDateChange = (weekName, newDateStr) => {
    setLocalWeeks(prev => prev.map(w => {
      if (w.name === weekName) {
        const { hours, minutes } = parseTimeString(w.timeString);
        const dateParts = newDateStr.split('-');
        const d = new Date(
          parseInt(dateParts[0], 10),
          parseInt(dateParts[1], 10) - 1,
          parseInt(dateParts[2], 10),
          hours,
          minutes,
          59,
          999
        );
        return {
          ...w,
          dateString: newDateStr,
          deadlineIso: d.toISOString()
        };
      }
      return w;
    }));
  };

  // Change specific week time (user types "11:59 pm" or selects preset)
  const handleWeekTimeChange = (weekName, newTimeStr) => {
    setLocalWeeks(prev => prev.map(w => {
      if (w.name === weekName) {
        const { hours, minutes } = parseTimeString(newTimeStr);
        const dateParts = w.dateString.split('-');
        const d = new Date(
          parseInt(dateParts[0], 10),
          parseInt(dateParts[1], 10) - 1,
          parseInt(dateParts[2], 10),
          hours,
          minutes,
          59,
          999
        );
        return {
          ...w,
          timeString: newTimeStr,
          deadlineIso: d.toISOString()
        };
      }
      return w;
    }));
  };

  // Reset to default Monday June 8, 2026 at 11:59 PM
  const handleResetToDefaults = () => {
    setStartDate(DEFAULT_SEMESTER_START);
    setGlobalTime('11:59 PM');
    const defaultWeeks = generateDefaultWeekRanges(DEFAULT_SEMESTER_START, 23, 59);
    setLocalWeeks(defaultWeeks);
  };

  // Save changes
  const handleSave = (e) => {
    e.preventDefault();
    setSemesterStartDate(startDate);

    const deadlineMap = {};
    localWeeks.forEach(w => {
      const { hours, minutes } = parseTimeString(w.timeString);
      const dateParts = w.dateString.split('-');
      const d = new Date(
        parseInt(dateParts[0], 10),
        parseInt(dateParts[1], 10) - 1,
        parseInt(dateParts[2], 10),
        hours,
        minutes,
        59,
        999
      );
      deadlineMap[w.name] = d.toISOString();
    });

    setCustomDeadlines(deadlineMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-3xl w-full p-6 relative max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <Calendar className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Semester Schedule & Deadlines (Week 1 - 18)</h3>
            <p className="text-xs text-gray-500">
              Set semester start date and due time (e.g. <strong>11:59 PM</strong> or <strong>05:00 PM</strong>) for Late (<span className="text-amber-700 font-bold">L</span>) tracking.
            </p>
          </div>
        </div>

        {/* Global Controls & Time Presets */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4 space-y-3">
          
          {/* Row 1: Start Date & Reset */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-bold text-gray-700 whitespace-nowrap">
                Week 1 Start Date (Monday):
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-google-blue"
              />
            </div>

            <button
              type="button"
              onClick={handleResetToDefaults}
              className="text-xs text-gray-600 hover:text-gray-900 font-semibold flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default (Mon Jun 8, 2026 @ 11:59 PM)</span>
            </button>
          </div>

          {/* Row 2: Global Due Time Presets & "Apply to All" */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Default Due Time:
              </span>

              {COMMON_TIME_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyTimeToAll(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                    globalTime === preset
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
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
                  className="w-24 px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800 text-center focus:ring-1 focus:ring-google-blue"
                />
                <button
                  type="button"
                  onClick={() => handleApplyTimeToAll(globalTime)}
                  className="px-2.5 py-1 bg-google-blue hover:bg-google-hover text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                  title="Apply entered time to all 18 weeks"
                >
                  <Zap className="w-3 h-3" />
                  <span>Apply All</span>
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
                className="p-3 bg-white border border-gray-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-gray-300"
              >
                <div>
                  <div className="font-extrabold text-gray-900 text-xs">{w.name}</div>
                  <div className="text-[10px] text-gray-500 font-medium">{w.formattedRange} (Mon-Fri)</div>
                </div>

                <div className="flex items-center space-x-2">
                  
                  {/* Due Date Picker */}
                  <input
                    type="date"
                    value={w.dateString}
                    onChange={(e) => handleWeekDateChange(w.name, e.target.value)}
                    className="px-2 py-1 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:ring-1 focus:ring-google-blue"
                  />

                  {/* Due Time Input / Presets (Supports 11:59 pm format) */}
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={w.timeString}
                      onChange={(e) => handleWeekTimeChange(w.name, e.target.value)}
                      placeholder="11:59 PM"
                      className="w-24 px-2 py-1 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 text-center focus:ring-1 focus:ring-google-blue"
                      title="Enter time like 11:59 PM, 5:00 PM, etc."
                    />
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-google-blue hover:bg-google-hover text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Apply Schedule & Deadlines</span>
          </button>
        </div>

      </div>
    </div>
  );
}
