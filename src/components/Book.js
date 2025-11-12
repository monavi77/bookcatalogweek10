import React, { useState, useEffect, useRef } from "react";
import "./Book.css";

// Direct API URL
const API_BASE = "https://api.itbook.store/1.0";

export default function Book({
  id,           
  title,
  price,
  image,
  url,           
  selected,
  onSelect = () => {},
  isLoaned,
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [bookDetails, setBookDetails] = useState(null);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [errorDetails, setErrorDetails] = useState("");
  const [errorSimilar, setErrorSimilar] = useState("");

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!showDetails || !id) return;

    const detailsController = new AbortController();
    const similarController = new AbortController();

    async function fetchDetailsAndSimilar() {
      let isDetailsPhase = true;
      try {
        setErrorDetails("");
        setErrorSimilar("");
        setLoadingDetails(true);

        // 1) Book details by ISBN-13
        const detailsRes = await fetch(`${API_BASE}/books/${id}`, {
          signal: detailsController.signal,
        });
        const detailsData = await detailsRes.json();

        if (!mountedRef.current) return;

        if (detailsData.error && detailsData.error !== "0") {
          throw new Error(detailsData.error === "1" ? "Book not found." : "Unknown API error.");
        }

        setBookDetails(detailsData);
        setLoadingDetails(false);
        isDetailsPhase = false;

        // 2) Similar books by author's last name (fallback: by title)
        setLoadingSimilar(true);
        let query;
        
        if (detailsData.authors?.trim()) {
          // Extract last name from authors field
          // Handle multiple authors by taking the first one
          const firstAuthor = detailsData.authors.split(',')[0].trim();
          // Split by spaces and take the last word as the last name
          const nameParts = firstAuthor.split(/\s+/);
          const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : firstAuthor;
          query = encodeURIComponent(lastName);
        } else {
          query = encodeURIComponent(detailsData.title || title || "");
        }

        const similarRes = await fetch(`${API_BASE}/search/${query}`, {
          signal: similarController.signal,
        });
        const similarData = await similarRes.json();

        if (!mountedRef.current) return;

        if (similarData.error && similarData.error !== "0") {
          throw new Error("Could not load similar books.");
        }

        const filtered = Array.isArray(similarData.books)
          ? similarData.books.filter((b) => b.isbn13 !== id).slice(0, 6)
          : [];

        setSimilarBooks(filtered);
        setLoadingSimilar(false);
      } catch (err) {
        if (detailsController.signal.aborted || similarController.signal.aborted) return;
        console.error("Fetch error:", err);
        if (isDetailsPhase) {
          setLoadingDetails(false);
          setErrorDetails("Could not load book details.");
        } else {
          setLoadingSimilar(false);
          setErrorSimilar("Could not load similar books.");
        }
      }
    }

    fetchDetailsAndSimilar();

    return () => {
      detailsController.abort();
      similarController.abort();
    };
  }, [showDetails, id, title]);

  const handleCardClick = (e) => {
    if (
      e.target.tagName === "BUTTON" ||
      e.target.closest("button") ||
      e.target.tagName === "A" ||
      e.target.closest("a")
    ) {
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
    setErrorDetails("");
    setErrorSimilar("");
  };

  if (showDetails) {
    const detailUrl = bookDetails?.url || url;
    const detailImage = bookDetails?.image || image;

    return (
      <div className="book-details-view">
        <button className="dismiss-btn" onClick={handleDismiss}>
          ← Back to List
        </button>

        <div className="book-details-content">
          <div className="book-details-main">
            <div className="book-details-image-container">
              <img
                src={detailImage}
                alt={bookDetails?.title || title || "Book cover"}
                className="book-details-image"
              />
              {detailUrl && (
                <a className="external-link" href={detailUrl} target="_blank" rel="noopener noreferrer">
                  View on itbook.store
                </a>
              )}
            </div>

            <div className="book-details-info">
              {loadingDetails ? (
                <p>Loading details...</p>
              ) : errorDetails ? (
                <p className="error-text">{errorDetails}</p>
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
                    {bookDetails.language && (
                      <p><strong>Language:</strong> {bookDetails.language}</p>
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
                    {bookDetails.pdf && typeof bookDetails.pdf === "object" && (
                      <div className="book-pdfs">
                        <strong>Sample PDFs:</strong>
                        <ul>
                          {Object.entries(bookDetails.pdf).map(([label, link]) => (
                            <li key={label}>
                              <a href={link} target="_blank" rel="noopener noreferrer">
                                {label}
                              </a>
                            </li>
                          ))}
                        </ul>
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
            ) : errorSimilar ? (
              <p className="error-text">{errorSimilar}</p>
            ) : similarBooks.length > 0 ? (
              <div className="similar-books-grid">
                {similarBooks.map((book) => (
                  <div key={book.isbn13} className="similar-book-card">
                    <a
                      href={`https://itbook.store/books/${book.isbn13}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open on itbook.store"
                    >
                      <img
                        src={book.image}
                        alt={book.title}
                        className="similar-book-image"
                      />
                    </a>
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
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(id)}
    >
      <img src={image} alt={title || "Book cover"} className="book-image" />
      <p className="title">{title}</p>
      {price && <p className="price">{price}</p>}
      {isLoaned && <p className="loaned-badge">On Loan</p>}
      <button className="view-details-btn" onClick={handleViewDetails}>
        View Details
      </button>
    </div>
  );
}
