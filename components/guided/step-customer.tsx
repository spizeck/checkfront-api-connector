"use client";

import { useEffect, useState } from "react";
import type { StepProps } from "@/app/guided/page";
import type { FormField } from "@/lib/checkfront-types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// Filter to only show customer-facing, non-archived form fields
function isVisibleField(field: FormField): boolean {
  if (field.define.archived === 1) return false;
  if (field.define.layout.start_hidden === 1) return false;
  const customerForm = field.define.layout.customer?.form;
  if (customerForm !== undefined && customerForm !== 1) return false;
  return true;
}

export function StepDetails({ state, updateState, onNext }: StepProps) {
  const [fields, setFields] = useState<Record<string, FormField>>({});
  const [formData, setFormData] = useState<Record<string, string>>(state.customerForm);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchForm() {
      try {
        const res = await fetch("/api/booking/form");
        if (!res.ok) throw new Error("Failed to load form");
        const data = await res.json();
        const allFields: Record<string, FormField> = data.booking_form_ui || {};
        // Filter to visible fields and sort by position
        const visible: Record<string, FormField> = {};
        const sorted = Object.entries(allFields)
          .filter(([, f]) => isVisibleField(f))
          .sort((a, b) => a[1].define.position - b[1].define.position);
        for (const [key, field] of sorted) {
          visible[key] = field;
        }
        setFields(visible);
      } catch {
        // Fallback to basic fields
        setFields({
          customer_name: {
            value: "",
            define: {
              field_id: "customer_name",
              is_filter: 0,
              required: 1,
              position: 0,
              archived: 0,
              layout: { lbl: "Full Name", type: "text" },
            },
          },
          customer_email: {
            value: "",
            define: {
              field_id: "customer_email",
              is_filter: 0,
              required: 1,
              position: 1,
              archived: 0,
              layout: { lbl: "Email Address", type: "text" },
            },
          },
        });
      } finally {
        setLoading(false);
      }
    }
    fetchForm();
  }, []);

  function updateField(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    for (const [key, field] of Object.entries(fields)) {
      const isRequired = field.define.required === 1;
      const value = formData[key]?.trim() || "";
      const lbl = field.define.layout.lbl;

      if (isRequired && !value) {
        newErrors[key] = `${lbl} is required`;
      }

      if (value && key === "customer_email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[key] = "Please enter a valid email address";
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (validate()) {
      updateState({ customerForm: formData });
      onNext();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Your Details</h2>
        <p className="mt-1 text-[var(--color-muted)]">
          Please provide your contact information
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {Object.entries(fields).map(([key, field]) => {
          const layout = field.define.layout;
          const isRequired = field.define.required === 1;

          if (layout.type === "select" && layout.options) {
            return (
              <Select
                key={key}
                label={layout.lbl}
                required={isRequired}
                options={Object.entries(layout.options).map(([val, label]) => ({
                  value: val,
                  label,
                }))}
                placeholder={`Select ${layout.lbl}`}
                value={formData[key] || ""}
                onChange={(e) => updateField(key, e.target.value)}
                error={errors[key]}
              />
            );
          }

          if (layout.type === "textarea") {
            return (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  {layout.lbl}
                  {isRequired && <span className="ml-1 text-[var(--color-error)]">*</span>}
                </label>
                <textarea
                  rows={3}
                  required={isRequired}
                  value={formData[key] || ""}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                />
                {errors[key] && (
                  <p className="text-sm text-[var(--color-error)]" role="alert">{errors[key]}</p>
                )}
              </div>
            );
          }

          if (layout.type === "checkbox") {
            return (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData[key] === "1"}
                  onChange={(e) => updateField(key, e.target.checked ? "1" : "0")}
                  className="h-4 w-4 rounded border-[var(--color-border)]"
                />
                {layout.lbl}
              </label>
            );
          }

          const inputType =
            key.includes("email")
              ? "email"
              : key.includes("phone")
                ? "tel"
                : "text";

          return (
            <Input
              key={key}
              label={layout.lbl}
              type={inputType}
              required={isRequired}
              value={formData[key] || ""}
              onChange={(e) => updateField(key, e.target.value)}
              error={errors[key]}
            />
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext}>Next: Complete Booking</Button>
      </div>
    </div>
  );
}
