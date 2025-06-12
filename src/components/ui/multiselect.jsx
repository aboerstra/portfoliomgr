import React from 'react';

export function MultiSelect({ id, options, value = [], onChange, placeholder = 'Select...' }) {
  const handleSelect = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
    onChange(selectedOptions);
  };

  return (
    <select
      id={id}
      multiple
      value={value}
      onChange={handleSelect}
      className="w-full border rounded px-2 py-1 min-h-[38px]"
      style={{ minHeight: 38 }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
} 