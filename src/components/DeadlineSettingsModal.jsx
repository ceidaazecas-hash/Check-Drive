import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Check, RotateCcw } from 'lucide-react';
import { generateDefaultWeekRanges, DEFAULT_SEMESTER_START } from '../utils/weekDeadlineManager';

export default function DeadlineSettingsModal({ isOpen, onClose, semesterStartDate, setSemesterStartDate, customDeadlines, setCustomDeadlines }) {
  const [startDate, setStartDate] = useState(semesterStartDate || DEFAULT_SEMESTER_START);
  const [localWeeks, setLocalWeeks] = useState(() => {
    const baseWeeks = generateDefaultWeekRanges(semesterStartDate || DEFAULT_SEMESTER_START);
    if (customDeadlines && Object.keys(customDeadlines).length > 0) {
      return baseWeeks.map(w => ({
        ...w,
        deadlineIso: customDeadlines[w.name] || w.deadlineIso
      }));
    }
    return baseWeeks;
  });

  // Keep synced whenever opened or props change
  useEffect(() => {
    if (isOpen) {
      const baseWeeks = generateDefaultWeekRanges(semesterStartDate || DEFAULT_SEMESTER_START);
      if (customDeadlines && Object.keys(customDeadlines).length > 0) {
        setLocalWeeks(baseWeeks.map(w => ({
          ...w,
          deadlineIso: customDeadlines[w.name] || w.deadlineIso
        })));
      } else {
        setLocalWeeks(baseWeeks);
      }
      setStartDate(semesterStartDate || DEFAULT_SEMESTER_START);
    }
  }, [isOpen, semesterStartDate, customDeadlines]);

  if (!isOpen) return null;

  const handleStartDateChange = (newDateStr) => {
    setStartDate(newDateStr);
    const newBaseWeeks = generateDefaultWeekRanges(newDateStr);
    setLocalWeeks(newBaseWeeks);
  };

  const handleDeadlineChange = (weekName, newDateTimeIso) => {
    setLocalWeeks(prev => prev.map(w => {
      if (w.name === weekName) {
        return { ...w, deadlineIso: newDateTimeIso };
      }
      return w;
    }));
  };

  const handleResetToDefaults = () => {
    setStartDate(DEFAULT_SEMESTER_START);
    const defaultWeeks = generateDefaultWeekRanges(DEFAULT_SEMESTER_START);
    setLocalWeeks(defaultWeeks);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSemesterStartDate(startDate);

    const deadlineMap = {};
    localWeeks.forEach(w => {
      deadlineMap[w.name] = w.deadlineIso;
    });
    setCustomDeadlines(deadlineMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] flex flex-col">
        
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
              Monday &ndash; Friday working week (excluding Saturdays &amp; Sundays) for late submission (L) detection.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Semester Week 1 Start Date (Monday):
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-900 focus:ring-1 focus:ring-google-blue"
            />
          </div>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default (Mon Jun 8, 2026)</span>
          </button>
        </div>

        {/* Weekly Deadlines List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {localWeeks.map(w => {
              // Convert ISO to datetime-local input format
              const dtLocalVal = new Date(w.deadlineIso).toISOString().slice(0, 16);

              return (
                <div key={w.name} className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs flex items-center justify-between shadow-2xs">
                  <div>
                    <div className="font-bold text-gray-900">{w.name}</div>
                    <div className="text-[10px] text-gray-500 font-medium">{w.formattedRange} (Mon-Fri)</div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <input
                      type="datetime-local"
                      value={dtLocalVal}
                      onChange={(e) => handleDeadlineChange(w.name, new Date(e.target.value).toISOString())}
                      className="px-2 py-1 bg-gray-50 border border-gray-300 rounded text-[11px] font-semibold text-gray-800 focus:ring-1 focus:ring-google-blue"
                    />
                  </div>
                </div>
              );
            })}
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
            className="px-4 py-2 bg-google-blue hover:bg-google-hover text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Apply Schedule & Deadlines</span>
          </button>
        </div>

      </div>
    </div>
  );
}
