"use client";

import { useState } from "react";
import { getAnonymousVisitorId } from "@/components/site-tracker";

function FieldVisualLabel({
  label,
  tone = "dark",
}: {
  label: string;
  tone?: "dark" | "light";
}) {
  const required = label.includes("*");
  const cleanLabel = label.replace("*", "").trimEnd();
  const textClass = tone === "light" ? "text-white" : "text-black";

  return (
    <span
      className={`pointer-events-none absolute left-5 top-4 text-[14px] font-bold leading-[25px] transition-opacity peer-focus:opacity-0 peer-[:not(:placeholder-shown)]:opacity-0 ${textClass}`}
    >
      {cleanLabel}
      {required ? <span className="text-[#E73E13]">*</span> : null}
    </span>
  );
}

export function ContactFormSection({
  fields,
  submitLabel,
  size = "default",
  recipientEmail,
}: {
  fields: Array<{ label: string; type: string }>;
  submitLabel: string;
  size?: "default" | "large";
  recipientEmail?: string;
}) {
  const [submitted, setSubmitted] = useState(false);

  function trackContact() {
    const match = window.location.pathname.match(/^\/published\/([^/]+)(\/.*)?$/);
    if (!match) return;
    void fetch("/api/site-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publishedSlug: decodeURIComponent(match[1]),
        pagePath: match[2] || "/",
        visitorId: getAnonymousVisitorId(),
        sessionId: crypto.randomUUID(),
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        trackContact();
        const recipient = recipientEmail?.trim();
        if (recipient) {
          const formData = new FormData(event.currentTarget);
          const lines = Array.from(formData.entries()).map(([key, value]) => `${key}: ${value}`).join("\n");
          window.setTimeout(() => { window.location.href = `mailto:${recipient}?subject=${encodeURIComponent("Nouvelle demande depuis le site")}&body=${encodeURIComponent(lines)}`; }, 120);
        }
      }}
    >
      {fields.map((field, index) => {
        const textarea = field.type === "textarea";
        const className = `w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-5 py-4 font-semibold leading-[25px] text-white outline-none placeholder:text-white focus:border-white/20 ${
          size === "large" ? "text-[16px]" : "text-[14px]"
        }`;

        return textarea ? (
          <label key={`${field.label}-${index}`} className="relative block">
            <textarea
              name={field.label.replace("*", "").trim()}
              aria-label={field.label}
              required={field.label.includes("*")}
              placeholder=" "
              className={`${className} peer min-h-[117px] resize-y`}
            />
            <FieldVisualLabel label={field.label} tone="light" />
          </label>
        ) : (
          <label key={`${field.label}-${index}`} className="relative block">
            <input
              name={field.label.replace("*", "").trim()}
              aria-label={field.label}
              required={field.label.includes("*")}
              type={field.type || "text"}
              placeholder=" "
              className={`${className} peer`}
            />
            <FieldVisualLabel label={field.label} tone="light" />
          </label>
        );
      })}
      <button
        type="submit"
        className="site-cta site-cta-primary cta-roll mt-5 w-full rounded-full text-[#00d494]"
      >
        {submitLabel}
      </button>
      {submitted ? (
        <p className="typo-body-small text-white/72">
          Merci, votre demande a bien été prise en compte.
        </p>
      ) : null}
    </form>
  );
}
