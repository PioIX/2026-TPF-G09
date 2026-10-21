"use client";

export default function Modal({ isOpen, onClose, titulo, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {titulo && <h2>{titulo}</h2>}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}