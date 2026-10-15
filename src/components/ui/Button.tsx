import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground",
  secondary: "bg-surface text-foreground border border-border",
  danger: "bg-danger text-accent-foreground",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`min-h-11 rounded-lg px-4 py-2 font-medium disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    />
  );
}
