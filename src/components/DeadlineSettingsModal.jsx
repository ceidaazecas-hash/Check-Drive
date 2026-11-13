import React, { useState, useEffect } from 'react';
import {
  calculateSemesterSchedule,
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

export default function DeadlineSettingsModal({
  isOpen,
  onClose,
  semesterStartDate,
  setSemesterStartDate,
  customDeadlines,
  setCustomDeadlines
}) {
  // Core state
  const [startDate, setStartDate] = useState(semesterStartDate || DEFAULT_SEMESTER_START);
  const [classesPerWeek, setClassesPerWeek] = useState(2); // 1 or 2
  const [class1Day, setClass1Day] = useState(1); // 1 = Mon
  const [class2Day, setClass2Day] = useState(3); // 3 = Wed
  const [dueTarget, setDueTarget] = useState('class2'); // 'class1', 'class2', 'sunday', 'friday'
  const [globalTime, setGlobalTime] = useState('05:00 PM');

  // 18 Weeks discrete schedule
  const [localWeeks, setLocalWeeks] = useState(() => {
    return generateDefaultWeekRanges(
      semesterStartDate || DEFAULT_SEMESTER_START,
      17,
      0,
      classesPerWeek,
      class1Day,
      class2Day,
      dueTarget
    );
  });

  // Synchronize when modal opens
  useEffect(() => {
    if (isOpen) {
      const activeStart = semesterStartDate || DEFAULT_SEMESTER_START;
      setStartDate(activeStart);

      // Determine initial day of week from start date
      const startD = parseLocalDate(activeStart);
      const dayNum = startD.getDay(); // 0 = Sun, 1 = Mon ...
      const initialC1 = dayNum === 0 ? 0 : dayNum;
      setClass1Day(initialC1);

      // Default class 2 to Wed if C1 is Mon, or Fri if C1 is Wed, etc.
      let initialC2 = 3; // Wed
      if (initialC1 === 1) initialC2 = 3; // Mon & Wed
      else if (initialC1 === 2) initialC2 = 4; // Tue & Thu
      else if (initialC1 === 3) initialC2 = 5; // Wed & Fri
      else initialC2 = (initialC1 + 2) % 7;
      setClass2Day(initialC2);

      const baseWeeks = calculateSemesterSchedule({
        startDateString: activeStart,
        classesPerWeek,
        class1Day: initialC1,
        class2Day: initialC2,
        dueTarget,
        defaultHours: 17,
        defaultMinutes: 0
      });

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

  /**
   * Helper to regenerate all 18 weeks when settings change
   */
  const regenerateSchedule = (newStart, newFreq, newC1, newC2, newDue, newTime) => {
    const timeParsed = parseTimeString(newTime || globalTime);
    const updated = calculateSemesterSchedule({
      startDateString: newStart || startDate,
      classesPerWeek: newFreq !== undefined ? newFreq : classesPerWeek,
      class1Day: newC1 !== undefined ? newC1 : class1Day,
      class2Day: newC2 !== undefined ? newC2 : class2Day,
      dueTarget: newDue !== undefined ? newDue : dueTarget,
      defaultHours: timeParsed.hours,
      defaultMinutes: timeParsed.minutes
    });

    setLocalWeeks(updated);
  };

  /**
   * Start Date change
   */
  const handleStartDateChange = (newDateStr) => {
    setStartDate(newDateStr);
    const d = parseLocalDate(newDateStr);
    const newC1 = d.getDay();
    setClass1Day(newC1);
    regenerateSchedule(newDateStr, classesPerWeek, newC1, class2Day, dueTarget, globalTime);
  };

  /**
   * Class Frequency toggle (1 vs 2)
   */
  const handleFrequencyChange = (freq) => {
    setClassesPerWeek(freq);
    const newDue = freq === 1 ? 'class1' : 'class2';
    setDueTarget(newDue);
    regenerateSchedule(startDate, freq, class1Day, class2Day, newDue, globalTime);
  };

  /**
   * Class 1 Day change
   */
  const handleClass1DayChange = (dayVal) => {
    setClass1Day(dayVal);
    regenerateSchedule(startDate, classesPerWeek, dayVal, class2Day, dueTarget, globalTime);
  };

  /**
   * Class 2 Day change (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)
   */
  const handleClass2DayChange = (dayVal) => {
    setClass2Day(dayVal);
    regenerateSchedule(startDate, classesPerWeek, class1Day, dayVal, dueTarget, globalTime);
  };

  /**
   * Due Target change
   */
  const handleDueTargetChange = (targetVal) => {
    setDueTarget(targetVal);
    regenerateSchedule(startDate, classesPerWeek, class1Day, class2Day, targetVal, globalTime);
  };

  /**
   * Time preset apply
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
   * Edit specific week date
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
   * Edit specific week time
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
   * Reset to default Monday & Wednesday schedule
   */
  const handleResetToDefaults = () => {
    setStartDate(DEFAULT_SEMESTER_START);
    setClassesPerWeek(2);
    setClass1Day(1); // Mon
    setClass2Day(3); // Wed
    setDueTarget('class2');
    setGlobalTime('05:00 PM');
    regenerateSchedule(DEFAULT_SEMESTER_START, 2, 1, 3, 'class2', '05:00 PM');
  };

  /**
   * Save and close
   */
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

  const c1Obj = WEEKDAYS.find(w => w.value === class1Day) || WEEKDAYS[0];
  const c2Obj = WEEKDAYS.find(w => w.value === class2Day) || WEEKDAYS[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-3xl w-full max-h-[92vh] flex flex-col relative animate-in fade-in zoom-in duration-150 border-0 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 px-2.5 py-1 text-gray-400 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors border-0 font-black text-sm"
          title="Close"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="mb-3 text-center">
          <h3 className="text-lg font-black text-gray-900">Semester Schedule & Deadlines</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Set class days, 1 or 2 classes per week, and weekly submission deadlines.
          </p>
        </div>

        {/* Clean Controls Card */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-3 space-y-3 border-0 text-xs">
          
          {/* Row 1: Start Date & Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            
            {/* Start Date */}
            <div className="flex items-center gap-2">
              <label className="font-bold text-gray-700 shrink-0">
                Week 1 Date:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="px-3 py-1.5 bg-white rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-google-blue border-0 shadow-2xs flex-1"
              />
            </div>

            {/* Class Frequency */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700 shrink-0">
                Frequency:
              </span>
              <div className="flex items-center gap-1.5 flex-1">
                <button
                  type="button"
                  onClick={() => handleFrequencyChange(1)}
                  className={`flex-1 py-1.5 rounded-xl font-black text-xs transition-all border-0 shadow-2xs ${
                    classesPerWeek === 1
                      ? 'bg-google-blue text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  1 Class / Week
                </button>
                <button
                  type="button"
                  onClick={() => handleFrequencyChange(2)}
                  className={`flex-1 py-1.5 rounded-xl font-black text-xs transition-all border-0 shadow-2xs ${
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

          {/* Row 2: Class Meeting Days (Direct Day Selection - Mon to Sun!) */}
          <div className="bg-white rounded-xl p-3 shadow-2xs space-y-2 border-0">
            
            {/* Class 1 Day */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-700 w-24 shrink-0">
                {classesPerWeek === 2 ? 'Class 1 Day:' : 'Class Day:'}
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {WEEKDAYS.map(w => (
                  <button
                    key={`c1-${w.value}`}
                    type="button"
                    onClick={() => handleClass1DayChange(w.value)}
                    className={`w-9 h-7 rounded-lg font-black text-xs transition-all border-0 ${
                      class1Day === w.value
                        ? 'bg-google-blue text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={w.full}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Class 2 Day (ALL 7 DAYS INCLUDED - Mon, Tue, Wed, Thu, Fri, Sat, Sun!) */}
            {classesPerWeek === 2 && (
              <div className="flex items-center gap-2 flex-wrap pt-1.5 border-t border-gray-100">
                <span className="font-bold text-gray-700 w-24 shrink-0">
                  Class 2 Day:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {WEEKDAYS.map(w => (
                    <button
                      key={`c2-${w.value}`}
                      type="button"
                      onClick={() => handleClass2DayChange(w.value)}
                      className={`w-9 h-7 rounded-lg font-black text-xs transition-all border-0 ${
                        class2Day === w.value
                          ? 'bg-[#48bb78] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={w.full}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Row 3: Submissions Due Target & Due Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            
            {/* Submissions Due On */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700 shrink-0">
                Due On:
              </span>
              <div className="flex items-center gap-1.5 flex-1">
                {classesPerWeek === 2 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDueTargetChange('class1')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs border-0 transition-all ${
                        dueTarget === 'class1'
                          ? 'bg-google-blue text-white shadow-xs'
                          : 'bg-white text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {c1Obj.label} (Class 1)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDueTargetChange('class2')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs border-0 transition-all ${
                        dueTarget === 'class2'
                          ? 'bg-[#48bb78] text-white shadow-xs'
                          : 'bg-white text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {c2Obj.label} (Class 2)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDueTargetChange('sunday')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs border-0 transition-all ${
                        dueTarget === 'sunday'
                          ? 'bg-[#805ad5] text-white shadow-xs'
                          : 'bg-white text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Sunday
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDueTargetChange('class1')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs border-0 transition-all ${
                        dueTarget === 'class1'
                          ? 'bg-google-blue text-white shadow-xs'
                          : 'bg-white text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {c1Obj.label} (Class)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDueTargetChange('friday')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs border-0 transition-all ${
                        dueTarget === 'friday'
                          ? 'bg-[#dd6b20] text-white shadow-xs'
                          : 'bg-white text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Friday
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDueTargetChange('sunday')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs border-0 transition-all ${
                        dueTarget === 'sunday'
                          ? 'bg-[#805ad5] text-white shadow-xs'
                          : 'bg-white text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Sunday
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Due Time Input & Presets */}
            <div className="flex items-center gap-1.5 justify-start sm:justify-end">
              <span className="font-bold text-gray-700 shrink-0">Time:</span>
              {['05:00 PM', '11:59 PM'].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyTimeToAll(preset)}
                  className={`px-2 py-1 rounded-lg font-bold text-xs border-0 transition-all ${
                    globalTime === preset
                      ? 'bg-[#f6ad55] text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {preset}
                </button>
              ))}

              <input
                type="text"
                value={globalTime}
                onChange={(e) => setGlobalTime(e.target.value)}
                placeholder="05:00 PM"
                className="w-20 px-2 py-1 bg-white rounded-lg font-bold text-gray-800 text-center border-0 shadow-2xs text-xs"
              />
              <button
                type="button"
                onClick={() => handleApplyTimeToAll(globalTime)}
                className="px-2.5 py-1 bg-google-blue hover:bg-google-hover text-white rounded-lg font-bold shadow-2xs border-0 text-xs"
              >
                Apply
              </button>
            </div>

          </div>

          {/* Schedule Summary Banner */}
          <div className="bg-blue-50/70 text-blue-900 rounded-xl px-3 py-1.5 font-bold text-[11px] flex items-center justify-between">
            <span>
              {classesPerWeek === 2
                ? `Schedule: ${c1Obj.full} & ${c2Obj.full} • Due on ${dueTarget === 'class1' ? c1Obj.full : dueTarget === 'class2' ? c2Obj.full : 'Sunday'} @ ${globalTime}`
                : `Schedule: Every ${c1Obj.full} • Due on ${dueTarget === 'class1' ? c1Obj.full : dueTarget === 'friday' ? 'Friday' : 'Sunday'} @ ${globalTime}`}
            </span>
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="text-blue-700 hover:text-blue-900 underline text-[10px] font-bold border-0"
            >
              Reset Default (Mon & Wed)
            </button>
          </div>

        </div>

        {/* 18-Week Schedule Grid - Displays BOTH class dates clearly! */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {localWeeks.map(w => (
              <div
                key={w.name}
                className="p-3 bg-gray-50 rounded-2xl flex flex-col justify-between gap-2 shadow-2xs border-0"
              >
                {/* Header row: Week name and Class Dates */}
                <div className="flex items-start justify-between gap-2">
                  <div className="font-black text-gray-900 text-xs shrink-0">
                    {w.name}
                  </div>

                  {/* BOTH Class Dates shown clearly! */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end text-[10px]">
                    <span className="px-2 py-0.5 rounded-md font-bold bg-blue-100 text-blue-800">
                      {classesPerWeek === 2 ? `Class 1: ${w.class1Formatted}` : `Class: ${w.class1Formatted}`}
                    </span>
                    {classesPerWeek === 2 && w.class2Formatted && (
                      <span className="px-2 py-0.5 rounded-md font-bold bg-green-100 text-green-800">
                        Class 2: {w.class2Formatted}
                      </span>
                    )}
                  </div>
                </div>

                {/* Deadline Picker Row */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200/50">
                  <span className="text-[10px] font-bold text-gray-500">
                    Due:
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Due Date Picker */}
                    <input
                      type="date"
                      value={w.dateString}
                      onChange={(e) => handleWeekDateChange(w.name, e.target.value)}
                      className="px-2 py-1 bg-white rounded-lg text-xs font-bold text-gray-800 border-0 shadow-2xs"
                    />

                    {/* Due Time Input */}
                    <input
                      type="text"
                      value={w.timeString}
                      onChange={(e) => handleWeekTimeChange(w.name, e.target.value)}
                      placeholder="05:00 PM"
                      className="w-20 px-2 py-1 bg-white rounded-lg text-xs font-bold text-gray-800 text-center border-0 shadow-2xs"
                      title="Due time"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 pt-2.5 border-t border-gray-100">
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
