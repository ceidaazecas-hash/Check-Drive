import React, { useState, useEffect } from 'react';
import {
  calculateWeekDeadlines,
  generateDefaultWeekRanges,
  DEFAULT_SEMESTER_START,
  WEEKDAYS,
  parseLocalDate,
  formatDateInput,
  format12HourTime,
  parseTimeString
} from '../utils/weekDeadlineManager';

const COMMON_TIME_PRESETS = [
  '05:00 PM',
  '11:59 PM',
  '11:59 AM',
  '06:00 PM',
  '09:00 PM'
];

const DEFAULT_CLASS_PRESETS = [
  {
    id: 'class-1',
    name: 'Class 1 (2x/week: Wed & Fri)',
    startDate: '2026-11-11',
    classesPerWeek: 2,
    secondClassOffset: 2,
    dueRule: 'same_day', // or 2nd_class
    dueTime: '05:00 PM'
  },
  {
    id: 'class-2',
    name: 'Class 2 (2x/week: Mon & Thu)',
    startDate: '2026-11-09',
    classesPerWeek: 2,
    secondClassOffset: 3,
    dueRule: '2nd_class',
    dueTime: '05:00 PM'
  },
  {
    id: 'class-weekly',
    name: '1 Class / Week (Weekly)',
    startDate: '2026-11-11',
    classesPerWeek: 1,
    secondClassOffset: 0,
    dueRule: 'same_day',
    dueTime: '05:00 PM'
  }
];

export default function DeadlineSettingsModal({
  isOpen,
  onClose,
  semesterStartDate,
  setSemesterStartDate,
  customDeadlines,
  setCustomDeadlines
}) {
  // Class presets stored in localStorage
  const [classPresets, setClassPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('class_schedule_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CLASS_PRESETS;
  });

  const [activePresetId, setActivePresetId] = useState(() => {
    return localStorage.getItem('active_class_preset_id') || 'class-1';
  });

  // Current schedule form state
  const [startDate, setStartDate] = useState(semesterStartDate || DEFAULT_SEMESTER_START);
  const [classesPerWeek, setClassesPerWeek] = useState(2); // 1 or 2 classes per week
  const [secondClassOffset, setSecondClassOffset] = useState(2); // +2 days (e.g. Wed -> Fri)
  const [dueRule, setDueRule] = useState('same_day'); // 'same_day', '2nd_class', 'sunday', 'friday'
  const [globalTime, setGlobalTime] = useState('05:00 PM');
  const [isEditingPresetName, setIsEditingPresetName] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');

  // 18 Weeks discrete schedule
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
            timeString: format12HourTime(d.getHours(), d.getMinutes()),
            dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' })
          };
        }
        return w;
      });
    }
    return baseWeeks;
  });

  // Synchronize when modal opens
  useEffect(() => {
    if (isOpen) {
      const activeStart = semesterStartDate || DEFAULT_SEMESTER_START;
      setStartDate(activeStart);

      // Try loading matching preset or custom deadlines
      const baseWeeks = generateDefaultWeekRanges(activeStart, 17, 0, dueRule, secondClassOffset);
      if (customDeadlines && Object.keys(customDeadlines).length > 0) {
        setLocalWeeks(baseWeeks.map(w => {
          const savedIso = customDeadlines[w.name];
          if (savedIso) {
            const d = new Date(savedIso);
            return {
              ...w,
              deadlineIso: savedIso,
              dateString: formatDateInput(d),
              timeString: format12HourTime(d.getHours(), d.getMinutes()),
              dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' })
            };
          }
          return w;
        }));
      } else {
        setLocalWeeks(baseWeeks);
      }
    }
  }, [isOpen, semesterStartDate, customDeadlines]);

  if (!isOpen) return null;

  // Day of week of the current start date
  const startDayDate = parseLocalDate(startDate);
  const startDayName = startDayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const startDayShort = startDayDate.toLocaleDateString('en-US', { weekday: 'short' });

  // Day of week of the 2nd class
  const secondClassDate = new Date(startDayDate);
  secondClassDate.setDate(startDayDate.getDate() + secondClassOffset);
  const secondClassDayName = secondClassDate.toLocaleDateString('en-US', { weekday: 'long' });
  const secondClassDayShort = secondClassDate.toLocaleDateString('en-US', { weekday: 'short' });

  /**
   * Recalculate all 18 weeks based on settings
   */
  const regenerateWeeks = (newStart, newRule, newOffset, newTime) => {
    const parsedTime = parseTimeString(newTime || globalTime);
    const updated = calculateWeekDeadlines({
      startDateString: newStart || startDate,
      dueRule: newRule !== undefined ? newRule : dueRule,
      secondClassOffset: newOffset !== undefined ? newOffset : secondClassOffset,
      defaultHours: parsedTime.hours,
      defaultMinutes: parsedTime.minutes
    });

    setLocalWeeks(updated);
  };

  /**
   * Start Date change handler: instantly recalculates all weeks
   */
  const handleStartDateChange = (newStartDateStr) => {
    setStartDate(newStartDateStr);
    regenerateWeeks(newStartDateStr, dueRule, secondClassOffset, globalTime);
  };

  /**
   * Due rule change: e.g. same day, 2nd class, Sunday, Friday
   */
  const handleDueRuleChange = (newRule) => {
    setDueRule(newRule);
    regenerateWeeks(startDate, newRule, secondClassOffset, globalTime);
  };

  /**
   * 2nd Class offset change (e.g. +2, +3, +4 days)
   */
  const handleSecondClassOffsetChange = (offset) => {
    setSecondClassOffset(offset);
    regenerateWeeks(startDate, dueRule, offset, globalTime);
  };

  /**
   * Classes per week toggle (1 vs 2)
   */
  const handleClassesPerWeekToggle = (num) => {
    setClassesPerWeek(num);
    const newRule = num === 2 ? 'same_day' : 'same_day';
    setDueRule(newRule);
    regenerateWeeks(startDate, newRule, secondClassOffset, globalTime);
  };

  /**
   * Change individual week date
   */
  const handleWeekDateChange = (weekName, newDateStr) => {
    setLocalWeeks(prev => prev.map(w => {
      if (w.name !== weekName) return w;
      const parsedTime = parseTimeString(w.timeString || '17:00');
      const parts = newDateStr.split('-').map(Number);
      const newD = new Date(parts[0], parts[1] - 1, parts[2], parsedTime.hours, parsedTime.minutes, 59, 999);
      
      return {
        ...w,
        deadlineIso: newD.toISOString(),
        dateString: newDateStr,
        dayOfWeek: newD.toLocaleDateString('en-US', { weekday: 'short' })
      };
    }));
  };

  /**
   * Change individual week time
   */
  const handleWeekTimeChange = (weekName, newTimeStr) => {
    setLocalWeeks(prev => prev.map(w => {
      if (w.name !== weekName) return w;
      const parsedTime = parseTimeString(newTimeStr);
      const baseD = parseLocalDate(w.dateString);
      baseD.setHours(parsedTime.hours, parsedTime.minutes, 59, 999);
      
      return {
        ...w,
        deadlineIso: baseD.toISOString(),
        timeString: newTimeStr
      };
    }));
  };

  /**
   * Apply time preset to all 18 weeks
   */
  const handleApplyTimeToAll = (timeStr) => {
    setGlobalTime(timeStr);
    const parsed = parseTimeString(timeStr);

    setLocalWeeks(prev => prev.map(w => {
      const baseD = parseLocalDate(w.dateString);
      baseD.setHours(parsed.hours, parsed.minutes, 59, 999);
      return {
        ...w,
        deadlineIso: baseD.toISOString(),
        timeString: timeStr
      };
    }));
  };

  /**
   * Load a class schedule preset
   */
  const handleSelectPreset = (preset) => {
    setActivePresetId(preset.id);
    setStartDate(preset.startDate);
    setClassesPerWeek(preset.classesPerWeek || 1);
    setSecondClassOffset(preset.secondClassOffset || 2);
    setDueRule(preset.dueRule || 'same_day');
    setGlobalTime(preset.dueTime || '05:00 PM');

    const parsedTime = parseTimeString(preset.dueTime || '05:00 PM');
    const updated = calculateWeekDeadlines({
      startDateString: preset.startDate,
      dueRule: preset.dueRule || 'same_day',
      secondClassOffset: preset.secondClassOffset || 2,
      defaultHours: parsedTime.hours,
      defaultMinutes: parsedTime.minutes
    });
    setLocalWeeks(updated);

    localStorage.setItem('active_class_preset_id', preset.id);
  };

  /**
   * Create a new class schedule preset
   */
  const handleAddNewPreset = () => {
    const newId = `class-${Date.now()}`;
    const newName = `Class ${classPresets.length + 1}`;
    const newPreset = {
      id: newId,
      name: newName,
      startDate: startDate,
      classesPerWeek: classesPerWeek,
      secondClassOffset: secondClassOffset,
      dueRule: dueRule,
      dueTime: globalTime
    };

    const updatedPresets = [...classPresets, newPreset];
    setClassPresets(updatedPresets);
    setActivePresetId(newId);
    localStorage.setItem('class_schedule_presets', JSON.stringify(updatedPresets));
    localStorage.setItem('active_class_preset_id', newId);
  };

  /**
   * Save current schedule to active preset and system
   */
  const handleSave = () => {
    const deadlineMap = {};
    localWeeks.forEach(w => {
      deadlineMap[w.name] = w.deadlineIso;
    });

    // Update active preset with current settings
    const updatedPresets = classPresets.map(p => {
      if (p.id === activePresetId) {
        return {
          ...p,
          startDate,
          classesPerWeek,
          secondClassOffset,
          dueRule,
          dueTime: globalTime
        };
      }
      return p;
    });

    setClassPresets(updatedPresets);
    localStorage.setItem('class_schedule_presets', JSON.stringify(updatedPresets));
    localStorage.setItem('active_class_preset_id', activePresetId);

    setSemesterStartDate(startDate);
    setCustomDeadlines(deadlineMap);
    localStorage.setItem('semester_start_date', startDate);
    localStorage.setItem('custom_week_deadlines', JSON.stringify(deadlineMap));
    onClose();
  };

  /**
   * Reset to current semester defaults
   */
  const handleResetToDefaults = () => {
    setStartDate(DEFAULT_SEMESTER_START);
    setGlobalTime('05:00 PM');
    setClassesPerWeek(2);
    setDueRule('same_day');
    setSecondClassOffset(2);
    regenerateWeeks(DEFAULT_SEMESTER_START, 'same_day', 2, '05:00 PM');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-3xl w-full max-h-[92vh] flex flex-col relative animate-in fade-in zoom-in duration-150 border-0 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 px-2.5 py-1 text-gray-400 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors border-0 font-black text-sm"
          title="Close modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="mb-4 text-center">
          <h3 className="text-lg font-black text-gray-900">Semester Schedule & Deadlines (Week 1 - 18)</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Set class days, 1 or 2 classes per week, and weekly deadlines for late tracking.
          </p>
        </div>

        {/* Top Control Panel */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-3 space-y-3.5 border-0 text-xs">
          
          {/* Section 1: Class Presets Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-200/60">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-gray-700 mr-1">Class Schedule:</span>
              {classPresets.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1 rounded-xl font-bold transition-all border-0 shadow-2xs ${
                    activePresetId === preset.id
                      ? 'bg-google-blue text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddNewPreset}
                className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold border-0 shadow-2xs"
                title="Save a new class schedule"
              >
                + New Class
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetToDefaults}
              className="text-xs text-gray-500 hover:text-gray-900 font-bold border-0 text-left sm:text-right"
            >
              Reset Default
            </button>
          </div>

          {/* Section 2: Start Date & Classes Per Week */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            
            {/* Start Date */}
            <div className="flex items-center gap-2">
              <label className="font-bold text-gray-700 shrink-0">
                Week 1 Start Date:
              </label>
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="px-3 py-1.5 bg-white rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-google-blue border-0 shadow-2xs w-full"
                />
                <span className="px-2 py-1 bg-[#1a73e8] text-white rounded-lg font-black shrink-0 text-[11px]">
                  {startDayShort}
                </span>
              </div>
            </div>

            {/* Classes per Week Toggle (1 class vs 2 classes per week) */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700 shrink-0">
                Class Frequency:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleClassesPerWeekToggle(1)}
                  className={`px-3 py-1.5 rounded-xl font-black transition-all border-0 shadow-2xs ${
                    classesPerWeek === 1
                      ? 'bg-[#1a73e8] text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  1 Class / Week
                </button>
                <button
                  type="button"
                  onClick={() => handleClassesPerWeekToggle(2)}
                  className={`px-3 py-1.5 rounded-xl font-black transition-all border-0 shadow-2xs ${
                    classesPerWeek === 2
                      ? 'bg-[#48bb78] text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  2 Classes / Week
                </button>
              </div>
            </div>

          </div>

          {/* Section 3: Submissions Due Rule & 2nd Class Options */}
          <div className="p-3 bg-white rounded-xl shadow-2xs border-0 space-y-2">
            
            {/* If 2 classes per week: Choose 2nd class day */}
            {classesPerWeek === 2 && (
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-gray-100">
                <span className="font-bold text-gray-700">2nd Class Day:</span>
                {[
                  { offset: 2, label: `+2 Days (${new Date(startDayDate.getTime() + 2 * 86400000).toLocaleDateString('en-US', { weekday: 'short' })})` },
                  { offset: 3, label: `+3 Days (${new Date(startDayDate.getTime() + 3 * 86400000).toLocaleDateString('en-US', { weekday: 'short' })})` },
                  { offset: 4, label: `+4 Days (${new Date(startDayDate.getTime() + 4 * 86400000).toLocaleDateString('en-US', { weekday: 'short' })})` }
                ].map(opt => (
                  <button
                    key={opt.offset}
                    type="button"
                    onClick={() => handleSecondClassOffsetChange(opt.offset)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs border-0 transition-all ${
                      secondClassOffset === opt.offset
                        ? 'bg-[#48bb78] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Submissions Due Day Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-gray-700">Due Every Week On:</span>
              
              {/* Option 1: On 1st Class Day (Same Date) */}
              <button
                type="button"
                onClick={() => handleDueRuleChange('same_day')}
                className={`px-3 py-1 rounded-lg font-black text-xs border-0 transition-all ${
                  dueRule === 'same_day'
                    ? 'bg-[#1a73e8] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {classesPerWeek === 2 ? `1st Class (${startDayShort})` : `Class Day (${startDayShort})`}
              </button>

              {/* Option 2: On 2nd Class Day (if 2 classes per week) */}
              {classesPerWeek === 2 && (
                <button
                  type="button"
                  onClick={() => handleDueRuleChange('2nd_class')}
                  className={`px-3 py-1 rounded-lg font-black text-xs border-0 transition-all ${
                    dueRule === '2nd_class'
                      ? 'bg-[#48bb78] text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  2nd Class ({secondClassDayShort})
                </button>
              )}

              {/* Option 3: End of Week (Sunday) */}
              <button
                type="button"
                onClick={() => handleDueRuleChange('sunday')}
                className={`px-3 py-1 rounded-lg font-black text-xs border-0 transition-all ${
                  dueRule === 'sunday'
                    ? 'bg-[#805ad5] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sunday (Weekend)
              </button>

              {/* Option 4: Friday */}
              <button
                type="button"
                onClick={() => handleDueRuleChange('friday')}
                className={`px-3 py-1 rounded-lg font-black text-xs border-0 transition-all ${
                  dueRule === 'friday'
                    ? 'bg-[#dd6b20] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Friday
              </button>
            </div>

          </div>

          {/* Section 4: Due Time Presets & "Apply All" */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-gray-700 mr-1">Due Time:</span>
              {COMMON_TIME_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyTimeToAll(preset)}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all border-0 shadow-2xs ${
                    globalTime === preset
                      ? 'bg-[#f6ad55] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {preset}
                </button>
              ))}

              <div className="flex items-center space-x-1 ml-1">
                <input
                  type="text"
                  value={globalTime}
                  onChange={(e) => setGlobalTime(e.target.value)}
                  placeholder="05:00 PM"
                  className="w-24 px-2 py-1 bg-white rounded-xl font-bold text-gray-800 text-center focus:ring-1 focus:ring-google-blue border-0 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleApplyTimeToAll(globalTime)}
                  className="px-3 py-1 bg-google-blue hover:bg-google-hover text-white rounded-xl font-bold shadow-2xs border-0"
                  title="Apply time to all 18 weeks"
                >
                  Apply All
                </button>
              </div>
            </div>

            {/* Live Schedule Summary */}
            <div className="text-[11px] font-bold text-gray-500 bg-white px-2.5 py-1 rounded-xl shadow-2xs">
              Week 1: <span className="text-gray-900 font-black">{localWeeks[0]?.dateString} ({localWeeks[0]?.dayOfWeek}) @ {localWeeks[0]?.timeString}</span>
            </div>
          </div>

        </div>

        {/* 18-Week Schedule Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {localWeeks.map(w => (
              <div
                key={w.name}
                className="p-3 bg-gray-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs border-0"
              >
                <div>
                  <div className="font-black text-gray-900 text-xs flex items-center gap-1.5">
                    <span>{w.name}</span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800">
                      {w.dayOfWeek}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium">
                    {w.dateString} @ {w.timeString}
                  </div>
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
                    placeholder="05:00 PM"
                    className="w-24 px-2 py-1 bg-white rounded-lg text-xs font-bold text-gray-800 text-center focus:ring-1 focus:ring-google-blue border-0 shadow-2xs"
                    title="Enter time like 05:00 PM, 11:59 PM, etc."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
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
