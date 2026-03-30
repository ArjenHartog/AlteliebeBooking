import React, { useState, useEffect, useCallback } from 'react';
import Calendar from './components/Calendar';
import ReservationForm from './components/ReservationForm';
import LanguageSelector from './components/LanguageSelector';
import { useLocale } from './LocaleContext';

function formatDateParam(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const localeMap = { en: 'en-GB', nl: 'nl-NL', de: 'de-CH' };

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
  const { t, locale } = useLocale();
  const { seasonStart, seasonEnd } = getSeasonBounds();

  const formatDate = useCallback(
    (d) =>
      d
        ? d.toLocaleDateString(localeMap[locale], {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : '\u2014',
    [locale]
  );

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
        setError(t('errorLoadAvailability'));
      } finally {
        setLoading(false);
      }
    }
    fetchAvailability();
  }, []);

  const getDateStatus = useCallback(
    (date) => {
      const d = formatDateParam(date);
      const range = bookedRanges.find((r) => d >= r.start && d < r.end);
      if (!range) return 'available';
      return range.status; // 'pending' or 'confirmed'
    },
    [bookedRanges]
  );

  const isDateBooked = useCallback(
    (date) => getDateStatus(date) !== 'available',
    [getDateStatus]
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
      setError(t('errorDatesConflict'));
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
        setError(t('errorDatesUnavailable'));
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
      setError(t('errorGeneric'));
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
        <LanguageSelector />
        <div className="header-inner">
          <span className="logo-mark">&#10022;</span>
          <h1 className="logo-text">Alte Liebe</h1>
          <p className="tagline">{t('tagline')}</p>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {/* Hero */}
        <section className="hero">
          <h2 className="hero-title">{t('heroTitle')}</h2>
          <p className="hero-season">
            {t('heroSeason', { year: seasonStart.getFullYear() })}
          </p>
          <p className="hero-subtitle">{t('heroSubtitle')}</p>
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
            <p className="loading-text">{t('heroSubtitle')}</p>
          </div>
        )}

        {/* Confirmed */}
        {step === 'confirmed' && confirmation && (
          <div className="confirmation-card">
            <div className="confirmation-icon">&#10003;</div>
            <h3 className="confirmation-title">{t('confirmTitle')}</h3>
            <p className="confirmation-subtitle">
              {t('confirmMessage', {
                name: confirmation.guestName,
                checkIn: formatDate(confirmation.checkIn),
                checkOut: formatDate(confirmation.checkOut),
                nights: confirmation.nights,
              })}
            </p>
            <div className="confirmation-details">
              <div className="confirmation-row">
                <span className="confirmation-label">{t('checkIn')}</span>
                <span className="confirmation-value">{formatDate(confirmation.checkIn)}</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">{t('checkOut')}</span>
                <span className="confirmation-value">{formatDate(confirmation.checkOut)}</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">{t('nightCount', { n: confirmation.nights })}</span>
                <span className="confirmation-value">{confirmation.nights}</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">{t('labelGuests')}</span>
                <span className="confirmation-value">{confirmation.guests || 2}</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">{t('labelEmail')}</span>
                <span className="confirmation-value">{confirmation.email}</span>
              </div>
            </div>
            <p className="confirmation-note">
              {t('confirmNote', { email: confirmation.email })}
            </p>
            <p className="confirmation-note">
              {t('confirmGuestCards')}
            </p>
            <p className="confirmation-note">
              {t('bringReminder')}
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
              &larr; {t('btnAnother')}
            </button>
          </div>
        )}

        {/* Calendar + Form flow */}
        {step !== 'confirmed' && !loading && (
          <>
            {/* Selection bar */}
            <div className="selection-bar">
              <div className="selection-date">
                <span className="selection-label">{t('checkIn')}</span>
                <span className="selection-value">
                  {selectedCheckIn ? formatDate(selectedCheckIn) : t('selectDate')}
                </span>
              </div>
              <div className="selection-arrow" aria-hidden="true">
                &rarr;
              </div>
              <div className="selection-date">
                <span className="selection-label">{t('checkOut')}</span>
                <span className="selection-value">
                  {selectedCheckOut ? formatDate(selectedCheckOut) : t('selectDate')}
                </span>
              </div>
              {nightCount > 0 && (
                <div className="nights-badge">
                  {t('nightCount', { n: nightCount })}
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
              getDateStatus={getDateStatus}
            />

            {/* Legend */}
            <div className="legend">
              <div className="legend-item">
                <span className="legend-dot legend-dot--selectable" />
                <span>{t('legendAvailable')}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-dot--booked" />
                <span>{t('legendConfirmed')}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-dot--pending" />
                <span>{t('legendPending')}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-dot--today" />
                <span>Today</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-dot--past" />
                <span>{t('legendPast')}</span>
              </div>
            </div>

            {/* Suggestion */}
            {nextAvailable && !selectedCheckIn && (
              <div className="suggestion-banner">
                <span className="suggestion-icon">&#9733;</span>
                <span>
                  {t('nextAvailable', {
                    start: formatDate(nextAvailable.start),
                    end: formatDate(
                      new Date(
                        nextAvailable.start.getFullYear(),
                        nextAvailable.start.getMonth(),
                        nextAvailable.start.getDate() + nextAvailable.nights
                      )
                    ),
                    nights: nextAvailable.nights,
                  })}
                </span>
              </div>
            )}
            {!nextAvailable && !selectedCheckIn && !loading && (
              <div className="suggestion-banner">
                <span className="suggestion-icon">&#9733;</span>
                <span>{t('seasonFullyBooked')}</span>
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
        <p>{t('footerLocation')}</p>
        <p>
          {t('footerContact')}{' '}
          <a href="mailto:info@alteliebe.com" className="footer-link">
            info@alteliebe.com
          </a>
        </p>
      </footer>
    </>
  );
}
