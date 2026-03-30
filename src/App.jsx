import React, { useState, useEffect, useCallback } from 'react';
import Calendar from './components/Calendar';
import ReservationForm from './components/ReservationForm';

function formatDateParam(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(d) {
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a, b) {
  const msDay = 86400000;
  return Math.round((b - a) / msDay);
}

function getSeasonBounds() {
  const now = new Date();
  const seasonYear = now.getMonth() > 9 ? now.getFullYear() + 1 : now.getFullYear();
  return {
    seasonStart: new Date(seasonYear, 4, 1),
    seasonEnd: new Date(seasonYear, 10, 1),
    seasonYear,
  };
}

export default function App() {
  const { seasonStart, seasonEnd } = getSeasonBounds();

  const [bookedRanges, setBookedRanges] = useState([]);
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);
  const [selectedCheckOut, setSelectedCheckOut] = useState(null);
  const [step, setStep] = useState('select');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  // Auto-dismiss error after 4 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  // Fetch availability on mount
  useEffect(() => {
    async function fetchAvailability() {
      try {
        const from = formatDateParam(seasonStart);
        const to = formatDateParam(seasonEnd);
        const res = await fetch(`/api/availability?from=${from}&to=${to}`);
        if (!res.ok) throw new Error('Failed to load availability');
        const data = await res.json();
        setBookedRanges(data.bookedRanges || []);
      } catch (err) {
        setError('Could not load calendar availability. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchAvailability();
  }, []);

  const isDateBooked = useCallback(
    (date) => {
      const d = formatDateParam(date);
      return bookedRanges.some((range) => d >= range.start && d < range.end);
    },
    [bookedRanges]
  );

  const isDateInSeason = useCallback(
    (date) => date >= seasonStart && date < seasonEnd,
    [seasonStart, seasonEnd]
  );

  const isDateSelectable = useCallback(
    (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return isDateInSeason(date) && !isDateBooked(date) && date >= today;
    },
    [isDateInSeason, isDateBooked]
  );

  const hasBookedInRange = useCallback(
    (start, end) => {
      const current = new Date(start);
      while (current < end) {
        if (isDateBooked(current)) return true;
        current.setDate(current.getDate() + 1);
      }
      return false;
    },
    [isDateBooked]
  );

  const findNextAvailable = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = today > seasonStart ? today : new Date(seasonStart);
    let streakStart = null;
    let streakLen = 0;
    const current = new Date(start);
    while (current < seasonEnd) {
      if (isDateSelectable(current)) {
        if (!streakStart) streakStart = new Date(current);
        streakLen++;
        if (streakLen >= 2) {
          return { start: streakStart, nights: streakLen };
        }
      } else {
        streakStart = null;
        streakLen = 0;
      }
      current.setDate(current.getDate() + 1);
    }
    return null;
  }, [seasonStart, seasonEnd, isDateSelectable]);

  function handleDateClick(date) {
    if (!isDateSelectable(date)) return;
    if (step === 'form' || step === 'confirmed') return;

    if (!selectedCheckIn || selectedCheckOut) {
      setSelectedCheckIn(date);
      setSelectedCheckOut(null);
      setStep('select');
      return;
    }

    if (date <= selectedCheckIn) {
      setSelectedCheckIn(date);
      setSelectedCheckOut(null);
      return;
    }

    if (hasBookedInRange(selectedCheckIn, date)) {
      setError('Your selected range includes dates that are already booked. Please choose different dates.');
      return;
    }

    setSelectedCheckOut(date);
    setStep('form');
  }

  function handleChangeDate() {
    setStep('select');
    setSelectedCheckOut(null);
  }

  async function handleReservationSubmit(formData) {
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        checkIn: formatDateParam(selectedCheckIn),
        checkOut: formatDateParam(selectedCheckOut),
        ...formData,
      };
      const res = await fetch('/api/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        setError('These dates are no longer available. Please select different dates.');
        setStep('select');
        setSelectedCheckIn(null);
        setSelectedCheckOut(null);
        // Refresh availability
        const from = formatDateParam(seasonStart);
        const to = formatDateParam(seasonEnd);
        const refreshRes = await fetch(`/api/availability?from=${from}&to=${to}`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setBookedRanges(data.bookedRanges || []);
        }
        return;
      }
      if (!res.ok) throw new Error('Reservation request failed');
      const data = await res.json();
      setConfirmation({
        ...data,
        checkIn: selectedCheckIn,
        checkOut: selectedCheckOut,
        nights: daysBetween(selectedCheckIn, selectedCheckOut),
        ...formData,
      });
      setStep('confirmed');
    } catch (err) {
      setError('Something went wrong submitting your reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const nightCount =
    selectedCheckIn && selectedCheckOut ? daysBetween(selectedCheckIn, selectedCheckOut) : 0;

  const nextAvailable = !selectedCheckIn && !loading ? findNextAvailable() : null;

  return (
    <>
      {/* Grain overlay */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <span className="logo-mark">&#10022;</span>
          <h1 className="logo-text">Alte Liebe</h1>
          <p className="tagline">A home in the Swiss mountains</p>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {/* Hero */}
        <section className="hero">
          <h2 className="hero-title">Reserve Your Stay</h2>
          <p className="hero-subtitle">
            Season {seasonStart.getFullYear()}: {formatDate(seasonStart)} &mdash;{' '}
            {formatDate(seasonEnd)}
          </p>
        </section>

        {/* Error banner */}
        {error && (
          <div className="error-banner" role="alert">
            <span className="error-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-container">
            <div className="spinner" aria-label="Loading availability" />
            <p className="loading-text">Loading availability&hellip;</p>
          </div>
        )}

        {/* Confirmed */}
        {step === 'confirmed' && confirmation && (
          <div className="confirmation-card">
            <div className="confirmation-icon">&#10003;</div>
            <h3 className="confirmation-title">Reservation Request Sent</h3>
            <p className="confirmation-subtitle">
              Thank you, {confirmation.guestName}! Your request has been received.
            </p>
            <div className="confirmation-details">
              <div className="confirmation-row">
                <span className="confirmation-label">Check-in</span>
                <span className="confirmation-value">{formatDate(confirmation.checkIn)}</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">Check-out</span>
                <span className="confirmation-value">{formatDate(confirmation.checkOut)}</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">Nights</span>
                <span className="confirmation-value">{confirmation.nights}</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">Guests</span>
                <span className="confirmation-value">{confirmation.guests || 2}</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">Email</span>
                <span className="confirmation-value">{confirmation.email}</span>
              </div>
            </div>
            <p className="confirmation-note">
              The host will review your request and confirm via email. The reservation is shown as
              tentative until confirmed.
            </p>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setStep('select');
                setSelectedCheckIn(null);
                setSelectedCheckOut(null);
                setConfirmation(null);
              }}
            >
              &larr; Make Another Reservation
            </button>
          </div>
        )}

        {/* Calendar + Form flow */}
        {step !== 'confirmed' && !loading && (
          <>
            {/* Selection bar */}
            <div className="selection-bar">
              <div className="selection-date">
                <span className="selection-label">Check-in</span>
                <span className="selection-value">
                  {selectedCheckIn ? formatDate(selectedCheckIn) : 'Select a date'}
                </span>
              </div>
              <div className="selection-arrow" aria-hidden="true">
                &rarr;
              </div>
              <div className="selection-date">
                <span className="selection-label">Check-out</span>
                <span className="selection-value">
                  {selectedCheckOut ? formatDate(selectedCheckOut) : 'Select a date'}
                </span>
              </div>
              {nightCount > 0 && (
                <div className="nights-badge">
                  {nightCount} night{nightCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Calendar */}
            <Calendar
              seasonStart={seasonStart}
              seasonEnd={seasonEnd}
              bookedRanges={bookedRanges}
              selectedCheckIn={selectedCheckIn}
              selectedCheckOut={selectedCheckOut}
              onDateClick={handleDateClick}
              isDateSelectable={isDateSelectable}
              isDateBooked={isDateBooked}
            />

            {/* Legend */}
            <div className="legend">
              <div className="legend-item">
                <span className="legend-dot legend-dot--selectable" />
                <span>Available</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-dot--booked" />
                <span>Booked</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-dot--selected" />
                <span>Selected</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-dot--today" />
                <span>Today</span>
              </div>
            </div>

            {/* Suggestion */}
            {nextAvailable && !selectedCheckIn && (
              <div className="suggestion-banner">
                <span className="suggestion-icon">&#9733;</span>
                <span>
                  Next available dates start{' '}
                  <strong>{formatDate(nextAvailable.start)}</strong>. Click a date on the calendar
                  to begin your reservation.
                </span>
              </div>
            )}

            {/* Reservation form */}
            {step === 'form' && selectedCheckIn && selectedCheckOut && (
              <ReservationForm
                checkIn={selectedCheckIn}
                checkOut={selectedCheckOut}
                nightCount={nightCount}
                onSubmit={handleReservationSubmit}
                onCancel={handleChangeDate}
                submitting={submitting}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Alte Liebe &middot; Biel, Wiler (L&ouml;tschental), Switzerland</p>
        <p>
          Questions?{' '}
          <a href="mailto:info@alteliebe.com" className="footer-link">
            info@alteliebe.com
          </a>
        </p>
      </footer>
    </>
  );
}
