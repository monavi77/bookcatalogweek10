import React from "react";
import "./Book.css";

export default function Book({
  id,
  title,
  price,
  image,
  url,
  selected,
  onSelect,
  isLoaned,
}) {
  return (
    <div
      className={`book-card ${selected ? "selected" : ""} ${isLoaned ? "loaned" : ""}`}
      onClick={() => onSelect(id)}
    >
      <img src={image} alt="Book cover" className="book-image" />
      <p className="title">{title}</p>
      {price && <p className="price">{price}</p>}
      {isLoaned && <p className="loaned-badge">On Loan</p>}
      <a href={url} target="_blank" rel="noopener noreferrer">
        View More
      </a>
    </div>
  );
}
