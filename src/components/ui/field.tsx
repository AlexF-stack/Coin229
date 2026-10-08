"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Formulaires Coin229 — même champ partout :
 *
 *   <Field label="Email" hint="Celui de ta boutique" error={errors.email}>
 *     <Input type="email" … />
 *   </Field>
 *
 * Field relie seul le label, le champ et le message (id, aria-describedby,
 * aria-invalid). Un champ peut aussi s'utiliser sans Field (barre de recherche…).
 */

type FieldState = { id: string; messageId?: string; invalid: boolean; valid: boolean; required: boolean };
const FieldContext = createContext<FieldState | null>(null);

export type FieldProps = {
  label: ReactNode;
  children: ReactNode;
  /** Aide sous le champ (remplacée par l'erreur s'il y en a une) */
  hint?: ReactNode;
  error?: ReactNode;
  /** Message de réussite (ex. « Code envoyé ») */
  success?: ReactNode;
  required?: boolean;
  /** Label masqué visuellement (reste lu par les lecteurs d'écran) */
  hideLabel?: boolean;
  id?: string;
  className?: string;
};

export function Field({ label, children, hint, error, success, required = false, hideLabel, id, className }: FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const message = error || success || hint;
  const messageId = message ? `${fieldId}-message` : undefined;
  return (
    <FieldContext.Provider value={{ id: fieldId, messageId, invalid: Boolean(error), valid: Boolean(success) && !error, required }}>
      <div className={cn("space-y-1.5", className)}>
        <label htmlFor={fieldId} className={cn("block text-sm font-medium text-fg", hideLabel && "sr-only")}>
          {label}
          {required && (
            <span className="ml-0.5 text-error" aria-hidden>
              *
            </span>
          )}
        </label>
        {children}
        {message && (
          <p
            id={messageId}
            className={cn(
              "flex items-start gap-1.5 text-xs",
              error ? "font-medium text-error" : success ? "text-success" : "text-muted"
            )}
            role={error ? "alert" : undefined}
          >
            {error ? (
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : success ? (
              <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : null}
            <span>{message}</span>
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

export type ControlSize = "sm" | "md";

/** Classes d'un champ — même hauteur, bordure, rayon, focus et états partout */
export function controlClasses({
  invalid = false,
  valid = false,
  size = "md",
  className,
}: { invalid?: boolean; valid?: boolean; size?: ControlSize; className?: string } = {}) {
  return cn(
    "w-full rounded-control border bg-surface px-3 text-fg outline-none transition-colors placeholder:text-muted",
    "hover:border-fg-secondary/40 focus:border-primary focus:ring-2 focus:ring-primary/15",
    "disabled:cursor-not-allowed disabled:bg-neutral-soft disabled:text-muted",
    // 16px sur mobile : iOS ne zoome pas sur le champ
    size === "md" ? "min-h-11 py-2.5 text-base md:text-sm" : "min-h-9 py-1.5 text-sm",
    invalid
      ? "border-error focus:border-error focus:ring-error/15"
      : valid
        ? "border-success focus:border-success focus:ring-success/15"
        : "border-border-strong",
    className
  );
}

/** Raccorde un champ à son Field (id, message, état) */
function useFieldProps(props: { id?: string; "aria-describedby"?: string; required?: boolean; invalid?: boolean }) {
  const field = useContext(FieldContext);
  const invalid = props.invalid ?? field?.invalid ?? false;
  return {
    id: props.id ?? field?.id,
    required: props.required ?? field?.required,
    "aria-invalid": invalid || undefined,
    "aria-describedby": cn(field?.messageId, props["aria-describedby"]) || undefined,
    invalid,
    valid: field?.valid ?? false,
  };
}

type OwnControlProps = { invalid?: boolean; controlSize?: ControlSize };

export type InputProps = InputHTMLAttributes<HTMLInputElement> &
  OwnControlProps & {
    /** Icône ou texte collé à gauche (ex. loupe, « +229 ») */
    leading?: ReactNode;
  };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid: invalidProp, controlSize = "md", leading, ...props },
  ref
) {
  const { invalid, valid, ...a11y } = useFieldProps({ ...props, invalid: invalidProp });
  const input = (
    <input
      ref={ref}
      {...props}
      {...a11y}
      className={controlClasses({ invalid, valid, size: controlSize, className: cn(leading != null && "pl-10", className) })}
    />
  );
  if (leading == null) return input;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted [&_svg]:h-4 [&_svg]:w-4">
        {leading}
      </span>
      {input}
    </div>
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & OwnControlProps;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid: invalidProp, controlSize = "md", rows = 4, ...props },
  ref
) {
  const { invalid, valid, ...a11y } = useFieldProps({ ...props, invalid: invalidProp });
  return (
    <textarea
      ref={ref}
      rows={rows}
      {...props}
      {...a11y}
      className={controlClasses({ invalid, valid, size: controlSize, className: cn("resize-y py-2.5", className) })}
    />
  );
});

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & OwnControlProps;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid: invalidProp, controlSize = "md", children, ...props },
  ref
) {
  const { invalid, valid, ...a11y } = useFieldProps({ ...props, invalid: invalidProp });
  return (
    <div className="relative">
      <select
        ref={ref}
        {...props}
        {...a11y}
        className={controlClasses({ invalid, valid, size: controlSize, className: cn("appearance-none pr-9", className) })}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  );
});

type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  description?: ReactNode;
};

function Choice({ type, label, description, className, id, ...props }: ChoiceProps & { type: "checkbox" | "radio" }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex cursor-pointer items-start gap-3 text-sm text-fg has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
        className
      )}
    >
      <input
        id={inputId}
        type={type}
        {...props}
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-primary",
          type === "checkbox" ? "rounded-badge" : "rounded-full"
        )}
      />
      <span className="min-w-0">
        <span className="block">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}

export function Checkbox(props: ChoiceProps) {
  return <Choice type="checkbox" {...props} />;
}

export function Radio(props: ChoiceProps) {
  return <Choice type="radio" {...props} />;
}
