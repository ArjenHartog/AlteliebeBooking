import React, { useState } from 'react';
import { useLocale } from '../LocaleContext';

function formatDateLocale(d, locale) {
  const localeMap = { en: 'en-GB', nl: 'nl-NL', de: 'de-CH' };
  return d.toLocaleDateString(localeMap[locale] || 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ReservationForm({
  checkIn,
  checkOut,
  nightCount,
  onSubmit,
  onCancel,
  submitting,
}) {
  const { t, locale } = useLocale();

  const [form, setForm] = useState({
    guestName: '',
    email: '',
    phone: '',
    guests: 2,
    message: '',
  });

  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'guests' ? parseInt(value, 10) || '' : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  function validate() {
    const errs = {};
    if (!form.guestName.trim()) {
      errs.guestName = t('required');
    }
    if (!form.email.trim()) {
      errs.email = t('required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = t('invalidEmail');
    }
    const guestNum = Number(form.guests);
    if (!guestNum || guestNum < 1 || guestNum > 12) {
      errs.guests = t('guestsRange', { max: 12 });
    }
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({
      guestName: form.guestName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      guests: Number(form.guests),
      message: form.message.trim(),
    });
  }

  return (
    <div className="reservation-card">
      <h3 className="reservation-title">{t('formTitle')}</h3>
      <p className="reservation-dates">
        {formatDateLocale(checkIn, locale)} &rarr; {formatDateLocale(checkOut, locale)}
        <span className="nights-badge nights-badge--inline">
          {t('nightCount', { n: nightCount })}
        </span>
      </p>

      {/* Pricing info */}
      <div className="pricing-banner">
        <p className="pricing-line">
          {t('formPricing')}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          {/* Full name */}
          <div className="form-field">
            <label htmlFor="guestName" className="form-label">
              {t('labelName')} <span className="required">*</span>
            </label>
            <input
              id="guestName"
              name="guestName"
              type="text"
              className={`form-input${errors.guestName ? ' form-input--error' : ''}`}
              value={form.guestName}
              onChange={handleChange}
              placeholder={t('placeholderName')}
              autoComplete="name"
              disabled={submitting}
            />
            {errors.guestName && <span className="form-error">{errors.guestName}</span>}
          </div>

          {/* Email */}
          <div className="form-field">
            <label htmlFor="email" className="form-label">
              {t('labelEmail')} <span className="required">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={`form-input${errors.email ? ' form-input--error' : ''}`}
              value={form.email}
              onChange={handleChange}
              placeholder={t('placeholderEmail')}
              autoComplete="email"
              disabled={submitting}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          {/* Phone */}
          <div className="form-field">
            <label htmlFor="phone" className="form-label">
              {t('labelPhone')}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="form-input"
              value={form.phone}
              onChange={handleChange}
              placeholder={t('placeholderPhone')}
              autoComplete="tel"
              disabled={submitting}
            />
          </div>

          {/* Number of guests */}
          <div className="form-field">
            <label htmlFor="guests" className="form-label">
              {t('labelGuests')}
            </label>
            <input
              id="guests"
              name="guests"
              type="number"
              className={`form-input${errors.guests ? ' form-input--error' : ''}`}
              value={form.guests}
              onChange={handleChange}
              min="1"
              max="12"
              disabled={submitting}
            />
            {errors.guests && <span className="form-error">{errors.guests}</span>}
          </div>
        </div>

        {/* Message */}
        <div className="form-field form-field--full">
          <label htmlFor="message" className="form-label">
            {t('labelMessage')}
          </label>
          <textarea
            id="message"
            name="message"
            className="form-input form-textarea"
            value={form.message}
            onChange={handleChange}
            placeholder={t('placeholderMessage')}
            rows="3"
            disabled={submitting}
          />
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={submitting}
          >
            {t('btnChangeDates')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <span className="btn-spinner" aria-hidden="true" />
                {t('btnSubmitting')}
              </>
            ) : (
              t('btnSubmit')
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
