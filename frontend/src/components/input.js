"use client";

export default function Input({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  className = "",
}) {
  return (
    <div className="input-group">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={className}
      />
    </div>
  );
}