import React from "react";

export default function IllustrationUi() {
  return (
    <div className="brutalist-card">
      <div className="brutalist-card__header">
        <div className="brutalist-card__icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>

        <div className="brutalist-card__alert">Warning</div>
      </div>

      <div className="brutalist-card__message">
        This is a brutalist card with a very angry button. Proceed with
        caution, you've been warned.
      </div>

      <div className="brutalist-card__actions">
        <a
          className="brutalist-card__button brutalist-card__button--mark"
          href="#"
        >
          Mark as Read
        </a>

        <a
          className="brutalist-card__button brutalist-card__button--read"
          href="#"
        >
          Okay
        </a>
      </div>
    </div>
  );
}