"use client";

import { useId } from "react";

import { TextField } from "@/components/ui/TextField";

export type GroupComboboxProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: readonly string[];
  placeholder?: string;
};

export function GroupCombobox({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
}: GroupComboboxProps) {
  const listId = useId();
  return (
    <>
      <TextField
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        list={listId}
        autoComplete="off"
      />
      <datalist id={listId}>
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  );
}
