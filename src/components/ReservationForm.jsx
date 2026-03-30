import React, { useState } from 'react';

function formatDate(d) {
  return d.toLocaleDateString('en-GB', {
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
      errs.guestName = 'Full name is required';
    }
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address';
    }
    const guestNum = Number(form.guests);
    if (!guestNum || guestNum < 1 || guestNum > 12) {
      errs.guests = 'Number of guests must be between 1 and 12';
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
      <h3 className="reservation-title">Complete Your Reservation</h3>
      <p className="reservation-dates">
        {formatDate(checkIn)} &rarr; {formatDate(checkOut)}
        <span className="nights-badge nights-badge--inline">
          {nightCount} night{nightCount !== 1 ? 's' : ''}
        </span>
      </p>

      {/* Pricing info */}
      <div className="pricing-banner">
        <p className="pricing-line">
          <strong>CHF 45</strong> per person per night (min. CHF 120/night)
        </p>
        <p className="pricing-line pricing-line--small">
          Tourist tax: CHF 4.80/adult, CHF 2.40/child (6&ndash;16) per night
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          {/* Full name */}
          <div className="form-field">
            <label htmlFor="guestName" className="form-label">
              Full name <span className="required">*</span>
            </label>
            <input
              id="guestName"
              name="guestName"
              type="text"
              className={`form-input${errors.guestName ? ' form-input--error' : ''}`}
              value={form.guestName}
              onChange={handleChange}
              placeholder="Your full name"
              autoComplete="name"
              disabled={submitting}
            />
            {errors.guestName && <span className="form-error">{errors.guestName}</span>}
          </div>

          {/* Email */}
          <div className="form-field">
            <label htmlFor="email" className="form-label">
              Email <span className="required">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={`form-input${errors.email ? ' form-input--error' : ''}`}
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              autoComplete="email"
              disabled={submitting}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          {/* Phone */}
          <div className="form-field">
            <label htmlFor="phone" className="form-label">
              Phone <span className="optional">(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="form-input"
              value={form.phone}
              onChange={handleChange}
              placeholder="+41 79 123 45 67"
              autoComplete="tel"
              disabled={submitting}
            />
          </div>

          {/* Number of guests */}
          <div className="form-field">
            <label htmlFor="guests" className="form-label">
              Number of guests
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
            Message <span className="optional">(optional)</span>
          </label>
          <textarea
            id="message"
            name="message"
            className="form-input form-textarea"
            value={form.message}
            onChange={handleChange}
            placeholder="Anything we should know? Special requests, arrival time, etc."
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
            &larr; Change Dates
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <span className="btn-spinner" aria-hidden="true" />
                Sending&hellip;
              </>
            ) : (
              'Request Reservation'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
