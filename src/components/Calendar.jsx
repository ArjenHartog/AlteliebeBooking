import React from 'react';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDateParam(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function MonthGrid({
  year,
  month,
  selectedCheckIn,
  selectedCheckOut,
  onDateClick,
  isDateSelectable,
  isDateBooked,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday = 0, Sunday = 6
  const firstDayRaw = new Date(year, month, 1).getDay();
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1;

  const blanks = Array.from({ length: firstDay }, (_, i) => (
    <div key={`blank-${i}`} className="day-cell day-cell--blank" />
  ));

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const date = new Date(year, month, dayNum);
    date.setHours(0, 0, 0, 0);

    const selectable = isDateSelectable(date);
    const booked = isDateBooked(date);
    const isToday = isSameDay(date, today);
    const isPast = date < today;
    const isCheckIn = isSameDay(date, selectedCheckIn);
    const isCheckOut = isSameDay(date, selectedCheckOut);
    const isInRange =
      selectedCheckIn &&
      selectedCheckOut &&
      date > selectedCheckIn &&
      date < selectedCheckOut;

    let className = 'day-cell';
    if (booked) className += ' booked';
    if (selectable) className += ' selectable';
    if (isCheckIn) className += ' check-in';
    if (isCheckOut) className += ' check-out';
    if (isInRange) className += ' in-range';
    if (isPast && !booked) className += ' past';
    if (isToday) className += ' today';

    const dateStr = formatDateParam(date);

    return (
      <div
        key={dayNum}
        className={className}
        role="button"
        tabIndex={selectable ? 0 : -1}
        aria-label={`${MONTH_NAMES[month]} ${dayNum}, ${year}${booked ? ', booked' : ''}${selectable ? ', available' : ''}${isCheckIn ? ', check-in' : ''}${isCheckOut ? ', check-out' : ''}`}
        data-date={dateStr}
        onClick={() => onDateClick(date)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onDateClick(date);
          }
        }}
      >
        <span className="day-number">{dayNum}</span>
        {booked && <span className="booked-dot" aria-hidden="true" />}
      </div>
    );
  });

  return (
    <div className="month-card">
      <h3 className="month-name">
        {MONTH_NAMES[month]} {year}
      </h3>
      <div className="weekday-headers">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="weekday-header">
            {wd}
          </div>
        ))}
      </div>
      <div className="days-grid">
        {blanks}
        {days}
      </div>
    </div>
  );
}

export default function Calendar({
  seasonStart,
  seasonEnd,
  bookedRanges,
  selectedCheckIn,
  selectedCheckOut,
  onDateClick,
  isDateSelectable,
  isDateBooked,
}) {
  const months = [];
  const current = new Date(seasonStart.getFullYear(), seasonStart.getMonth(), 1);
  while (current < seasonEnd) {
    months.push({ year: current.getFullYear(), month: current.getMonth() });
    current.setMonth(current.getMonth() + 1);
  }

  return (
    <div className="calendar-grid" role="group" aria-label="Availability calendar">
      {months.map(({ year, month }) => (
        <MonthGrid
          key={`${year}-${month}`}
          year={year}
          month={month}
          selectedCheckIn={selectedCheckIn}
          selectedCheckOut={selectedCheckOut}
          onDateClick={onDateClick}
          isDateSelectable={isDateSelectable}
          isDateBooked={isDateBooked}
        />
      ))}
    </div>
  );
}
