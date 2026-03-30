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

function MountainSVG() {
  return (
    <svg
      className="hero-svg"
      viewBox="0 0 1200 400"
      preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a9abf" />
          <stop offset="50%" stopColor="#87CEEB" />
          <stop offset="100%" stopColor="#c8dce8" />
        </linearGradient>
      </defs>
      {/* Sky */}
      <rect width="1200" height="400" fill="url(#skyGrad)" />
      {/* Far mountains — gentle rolling peaks */}
      <polygon
        points="0,320 60,280 130,295 210,260 300,275 380,250 470,270 540,240 620,265 700,235 780,258 860,230 940,255 1010,238 1080,260 1140,245 1200,270 1200,400 0,400"
        fill="#6b8f5e"
        opacity="0.7"
      />
      {/* Mid mountains — sharper peaks */}
      <polygon
        points="0,350 80,310 150,330 230,280 310,310 400,265 480,300 550,255 630,290 720,250 800,285 870,260 960,290 1040,270 1120,295 1200,310 1200,400 0,400"
        fill="#4a7040"
      />
      {/* Mid mountain snow caps */}
      <polygon points="545,255 560,270 530,270" fill="#ffffff" opacity="0.9" />
      <polygon points="718,250 733,267 703,267" fill="#ffffff" opacity="0.85" />
      {/* Near mountains — tallest, darkest */}
      <polygon
        points="0,370 70,340 160,360 250,310 340,345 420,305 500,340 580,295 660,330 740,300 830,335 910,315 1000,345 1080,320 1160,350 1200,340 1200,400 0,400"
        fill="#3a5c30"
      />
      {/* Near mountain snow cap */}
      <polygon points="578,295 595,315 561,315" fill="#ffffff" opacity="0.9" />
    </svg>
  );
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
      {/* Mountain Hero */}
      <header className="hero">
        <MountainSVG />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="flag-badge">
            <span className="swiss-cross" aria-hidden="true" />
            <span>{t('heroBadge') || 'L\u00f6tschental, Switzerland'}</span>
          </div>
          <h1>Alte Liebe</h1>
          <p className="tagline">{t('heroTagline') || 'Your mountain home since 1742'}</p>
        </div>
        <LanguageSelector />
      </header>

      {/* Main content area */}
      <main className="wood-body">
        {/* Section hero */}
        <section className="section-hero">
          <h2 className="section-hero-title">{t('heroTitle')}</h2>
          <p className="section-hero-season">
            {t('heroSeason', { year: seasonStart.getFullYear() })}
          </p>
          <p className="section-hero-subtitle">{t('heroSubtitle')}</p>
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
            <div className="bring-reminder">
              <strong>{t('bringReminderTitle')}</strong> {t('bringReminder')}
            </div>
            <button
              className="btn btn-accent"
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

            {/* Calendar wrapped in card with red stripe */}
            <div className="calendar-card">
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
                  <span className="legend-dot legend-dot--confirmed" />
                  <span>{t('legendConfirmed')}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot legend-dot--pending" />
                  <span>{t('legendPending')}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot legend-dot--today" />
                  <span>{t('legendToday')}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot legend-dot--past" />
                  <span>{t('legendPast')}</span>
                </div>
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
        <div className="footer-brand">
          <span className="swiss-cross-sm" aria-hidden="true" />
          <span className="footer-logo">Alte Liebe</span>
        </div>
        <p>
          Biel, 3918 Wiler (L&ouml;tschental) &middot;{' '}
          <a href="mailto:info@alteliebe.com" className="footer-link">
            info@alteliebe.com
          </a>
        </p>
      </footer>
    </>
  );
}
