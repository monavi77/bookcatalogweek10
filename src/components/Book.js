import React, { useState, useEffect } from "react";
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
  const [showDetails, setShowDetails] = useState(false);
  const [bookDetails, setBookDetails] = useState(null);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    if (showDetails && id) {
      // Fetch book details
      setLoadingDetails(true);
      fetch(`https://api.itbook.store/1.0/books/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setBookDetails(data);
          setLoadingDetails(false);

          // Fetch similar books using author as search query
          setLoadingSimilar(true);
          let searchQuery;
          
          if (data.authors) {
            // Extract first author name (authors field might contain multiple authors separated by commas)
            const authorName = data.authors.split(',')[0].trim();
            searchQuery = encodeURIComponent(authorName);
          } else {
            // If no author found, use title as fallback
            searchQuery = encodeURIComponent(title);
          }
          
          return fetch(`https://api.itbook.store/1.0/search/${searchQuery}`);
        })
        .then((res) => res.json())
        .then((data) => {
          // Filter out the current book from similar books
          const filtered = data.books
            ? data.books.filter((book) => book.isbn13 !== id).slice(0, 6)
            : [];
          setSimilarBooks(filtered);
          setLoadingSimilar(false);
        })
        .catch((error) => {
          console.error("Error fetching book details:", error);
          setLoadingDetails(false);
          setLoadingSimilar(false);
        });
    }
  }, [showDetails, id, title]);

  const handleCardClick = (e) => {
    // Don't trigger selection if clicking the button
    if (e.target.tagName === "BUTTON" || e.target.closest("button")) {
      return;
    }
    onSelect(id);
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    setShowDetails(true);
  };

  const handleDismiss = () => {
    setShowDetails(false);
    setBookDetails(null);
    setSimilarBooks([]);
  };

  if (showDetails) {
    return (
      <div className="book-details-view">
        <button className="dismiss-btn" onClick={handleDismiss}>
          ← Back to List
        </button>
        
        <div className="book-details-content">
          <div className="book-details-main">
            <div className="book-details-image-container">
               <img
                 src={bookDetails?.image || image}
                 alt="Book cover"
                 className="book-details-image"
               />
                <a href={url} target="_blank" rel="noopener noreferrer">
                  View More
                </a>
             </div>
            <div className="book-details-info">
              {loadingDetails ? (
                <p>Loading details...</p>
              ) : bookDetails ? (
                <>
                  <h2 className="book-details-title">{bookDetails.title || title}</h2>
                  {bookDetails.subtitle && (
                    <p className="book-details-subtitle">{bookDetails.subtitle}</p>
                  )}
                  <div className="book-details-meta">
                    {bookDetails.authors && (
                      <p><strong>Author(s):</strong> {bookDetails.authors}</p>
                    )}
                    {bookDetails.publisher && (
                      <p><strong>Publisher:</strong> {bookDetails.publisher}</p>
                    )}
                    {bookDetails.year && (
                      <p><strong>Publication Year:</strong> {bookDetails.year}</p>
                    )}
                    {bookDetails.pages && (
                      <p><strong>Pages:</strong> {bookDetails.pages}</p>
                    )}
                    {bookDetails.isbn13 && (
                      <p><strong>ISBN-13:</strong> {bookDetails.isbn13}</p>
                    )}
                    {bookDetails.isbn10 && (
                      <p><strong>ISBN-10:</strong> {bookDetails.isbn10}</p>
                    )}
                    {bookDetails.price && (
                      <p><strong>Price:</strong> {bookDetails.price}</p>
                    )}
                    {bookDetails.rating && (
                      <p><strong>Rating:</strong> {bookDetails.rating}/5</p>
                    )}
                    {bookDetails.desc && (
                      <div className="book-description">
                        <strong>Description:</strong>
                        <p>{bookDetails.desc}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="book-details-title">{title}</h2>
                  {price && <p><strong>Price:</strong> {price}</p>}
                </>
              )}
            </div>
          </div>

          <div className="similar-books-section">
            <h3>Similar Books</h3>
            {loadingSimilar ? (
              <p>Loading similar books...</p>
            ) : similarBooks.length > 0 ? (
              <div className="similar-books-grid">
                {similarBooks.map((book) => (
                  <div key={book.isbn13} className="similar-book-card">
                    <img
                      src={book.image}
                      alt={book.title}
                      className="similar-book-image"
                    />
                    <p className="similar-book-title">{book.title}</p>
                    {book.price && (
                      <p className="similar-book-price">{book.price}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No similar books found.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`book-card ${selected ? "selected" : ""} ${isLoaned ? "loaned" : ""}`}
      onClick={handleCardClick}
    >
      <img src={image} alt="Book cover" className="book-image" />
      <p className="title">{title}</p>
      {price && <p className="price">{price}</p>}
      {isLoaned && <p className="loaned-badge">On Loan</p>}
      <button className="view-details-btn" onClick={handleViewDetails}>
        View Details
      </button>
    </div>
  );
}
