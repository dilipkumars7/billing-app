import React from "react";

export default function FormErrorMessage({ message }) {
  if (!message) return null;

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 1 }} className="error">
      <svg width="18" height="20" viewBox="0 0 24 24" role="presentation">
        <g fillRule="evenodd">
          <path
            fill="currentcolor"
            d="M13.416 4.417a2 2 0 0 0-2.832 0l-6.168 6.167a2 2 0 0 0 0 2.833l6.168 6.167a2 2 0 0 0 2.832 0l6.168-6.167a2 2 0 0 0 0-2.833z"
          />
          <path
            fill="#fff"
            d="M12 14a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0v5a1 1 0 0 1-1 1m0 3a1 1 0 0 1 0-2 1 1 0 0 1 0 2"
          />
        </g>
      </svg>
      {message}
    </span>
  );
}
