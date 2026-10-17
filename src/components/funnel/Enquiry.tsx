"use client";

import { useId, useState } from "react";

import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { whatsappHref } from "@/lib/whatsapp";
import { enquiry, residenceTypes, site } from "@/data/site";

type Values = {
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  consent: boolean;
};

type Errors = Partial<Record<keyof Values, string>>;

const EMPTY: Values = {
  name: "",
  email: "",
  phone: "",
  interest: enquiry.interestDefault,
  message: "",
  consent: false,
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (values.name.trim().length < 2) errors.name = enquiry.errors.name;
  if (!EMAIL.test(values.email.trim())) errors.email = enquiry.errors.email;
  if (values.phone.replace(/[^\d]/g, "").length < 7) errors.phone = enquiry.errors.phone;
  if (!values.consent) errors.consent = enquiry.errors.consent;
  return errors;
}

function composeMessage(values: Values): string {
  return [
    `Enquiry from ${values.name.trim()}.`,
    `Residence: ${values.interest}.`,
    `Email: ${values.email.trim()}`,
    `Phone: ${values.phone.trim()}`,
    values.message.trim() ? `Message: ${values.message.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function Enquiry() {
  const uid = useId();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const field = (key: keyof Values) => `enquiry-${uid}-${key}`;
  const error = (key: keyof Values) => `enquiry-${uid}-${key}-error`;

  const update = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      track("enquiry_invalid");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        setStatus("error");
        track("enquiry_failed", { status: response.status });
        return;
      }

      setStatus("success");
      track("enquiry_submitted", { interest: values.interest });
    } catch {
      setStatus("error");
      track("enquiry_failed", { status: 0 });
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="border border-hairline bg-ink-sunken p-8"
        data-enquiry-success
      >
        <p className="display-s">{enquiry.successTitle}</p>
        <p className="body-copy mt-4">{enquiry.successBody}</p>
        <a
          href={whatsappHref(composeMessage(values))}
          target="_blank"
          rel="noopener noreferrer"
          data-analytics="cta:enquiry-whatsapp"
          className="mt-6 inline-flex min-h-11 items-center bg-bronze px-6 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-ink transition-opacity duration-[var(--duration-ui)] hover:opacity-90"
        >
          {enquiry.successCta}
        </a>
      </div>
    );
  }

  const hasFieldErrors = Boolean(errors.name || errors.email || errors.phone || errors.consent);

  return (
    <form noValidate onSubmit={onSubmit} data-enquiry-form className="grid-12 gap-y-6">
      <div className="col-span-4 md:col-span-3">
        <Field
          id={field("name")}
          label={enquiry.fields.name}
          errorId={error("name")}
          error={errors.name}
          required
        >
          <input
            id={field("name")}
            name="name"
            type="text"
            autoComplete="name"
            required
            value={values.name}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? error("name") : undefined}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="col-span-4 md:col-span-3">
        <Field
          id={field("email")}
          label={enquiry.fields.email}
          errorId={error("email")}
          error={errors.email}
          required
        >
          <input
            id={field("email")}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? error("email") : undefined}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="col-span-4 md:col-span-3">
        <Field
          id={field("phone")}
          label={enquiry.fields.phone}
          errorId={error("phone")}
          error={errors.phone}
          required
        >
          <input
            id={field("phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            value={values.phone}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? error("phone") : undefined}
            onChange={(e) => update("phone", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="col-span-4 md:col-span-3">
        <Field id={field("interest")} label={enquiry.fields.interest}>
          <select
            id={field("interest")}
            name="interest"
            value={values.interest}
            onChange={(e) => update("interest", e.target.value)}
            className={cn(inputClass, "appearance-none")}
          >
            <option>{enquiry.interestDefault}</option>
            {residenceTypes.map((type) => (
              <option key={type.id}>{`${type.name} — ${type.typology}`}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="col-span-4 md:col-span-6">
        <Field id={field("message")} label={enquiry.fields.message}>
          <textarea
            id={field("message")}
            name="message"
            rows={3}
            placeholder={enquiry.messagePlaceholder}
            value={values.message}
            onChange={(e) => update("message", e.target.value)}
            className={cn(inputClass, "resize-none")}
          />
        </Field>
      </div>

      <div className="col-span-4 md:col-span-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            id={field("consent")}
            name="consent"
            type="checkbox"
            checked={values.consent}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? error("consent") : undefined}
            onChange={(e) => update("consent", e.target.checked)}
            className="mt-1 size-4 shrink-0 accent-bronze"
          />
          <span className="caption">{enquiry.consent}</span>
        </label>
        {errors.consent && (
          <p id={error("consent")} className="caption mt-2 text-bronze">
            {errors.consent}
          </p>
        )}
      </div>

      <div className="col-span-4 flex flex-wrap items-center gap-x-6 gap-y-3 md:col-span-6">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex min-h-11 items-center bg-ivory px-7 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-ink transition-opacity duration-[var(--duration-ui)] hover:opacity-90 disabled:opacity-60"
        >
          {status === "sending" ? enquiry.submitting : enquiry.submit}
        </button>
        <a href={site.phoneHref} className="link-underline caption">
          Or call {site.phone}
        </a>
      </div>

      {hasFieldErrors && (
        <p role="alert" className="caption col-span-4 text-bronze md:col-span-6">
          {enquiry.errors.summary}
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="caption col-span-4 text-bronze md:col-span-6">
          {enquiry.errors.form}
        </p>
      )}
    </form>
  );
}

const inputClass =
  "w-full border-b border-hairline bg-transparent py-3 text-ivory placeholder:text-ivory-faint transition-colors duration-[var(--duration-ui)] focus:border-bronze focus:outline-none";

function Field({
  id,
  label,
  errorId,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  errorId?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow block">
        {label}
        {required && <span className="visually-hidden"> (required)</span>}
      </label>
      <div className="mt-2">{children}</div>
      {error && (
        <p id={errorId} className="caption mt-2 text-bronze">
          {error}
        </p>
      )}
    </div>
  );
}
