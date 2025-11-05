import React, { useEffect, useState } from "react";
import Book from "./components/Book";
import "./App.css";

function App() {
  const [books, setBooks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [priceFilter, setPriceFilter] = useState("all");
  const [currentView, setCurrentView] = useState("books");
  const [loans, setLoans] = useState([]);
  const [loanForm, setLoanForm] = useState({
    borrower: "",
    bookId: "",
    loanPeriod: 1,
  });
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    url: "",
    image: "",
    price: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("books");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setBooks(
          parsed.map((b) => ({
            ...b,
            selected: false,
          }))
        );
        return;
      } catch (_) {
        // ignore and fallback to fetch
      }
    }
    fetch("/data/books.json")
      .then((res) => res.json())
      .then((json) =>
        setBooks(
          json.map((b) => ({
            ...b,
            selected: false,
          }))
        )
      );
  }, []);

  useEffect(() => {
    if (books && books.length) {
      localStorage.setItem("books", JSON.stringify(books));
    } else {
      localStorage.removeItem("books");
    }
  }, [books]);


  useEffect(() => {
    const storedLoans = localStorage.getItem("loans");
    if (storedLoans) {
      try {
        setLoans(JSON.parse(storedLoans));
      } catch (_) {
        
      }
    }
  }, []);

  useEffect(() => {
    if (loans && loans.length >= 0) {
      localStorage.setItem("loans", JSON.stringify(loans));
    }
  }, [loans]);

  const handleSelect = (id) => {
    setBooks((prevBooks) =>
      prevBooks.map((b) => ({
        ...b,
        selected: b.isbn13 === id ? !b.selected : false,
      }))
    );
  };

  const handleDelete = () => {
    setBooks((prevBooks) => prevBooks.filter((b) => !b.selected));
  };

  const handleAdd = (e) => {
    e.preventDefault();

    if (editingId) {
      setBooks((prev) =>
        prev.map((b) =>
          b.isbn13 === editingId
            ? {
                ...b,
                title: formData.title,
                author: formData.author,
                url: formData.url,
                image: formData.image || b.image || "https://via.placeholder.com/150x200",
                price: formData.price ? `$${parseFloat(formData.price).toFixed(2)}` : b.price,
                selected: false,
              }
            : b
        )
      );
    } else {
      const newBook = {
        isbn13: Date.now().toString(),
        title: formData.title,
        author: formData.author,
        url: formData.url,
        image: formData.image || "https://via.placeholder.com/150x200",
        price: formData.price ? `$${parseFloat(formData.price).toFixed(2)}` : undefined,
        selected: false,
      };
      setBooks((prev) => [...prev, newBook]);
    }

    setFormData({ title: "", author: "", url: "", image: "", price: "" });
    setEditingId(null);
    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoanFormChange = (e) => {
    const { name, value } = e.target;
    setLoanForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoanSubmit = (e) => {
    e.preventDefault();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(loanForm.loanPeriod) * 7);
    
    const newLoan = {
      id: Date.now().toString(),
      borrower: loanForm.borrower,
      bookId: loanForm.bookId,
      loanPeriod: parseInt(loanForm.loanPeriod),
      dueDate: dueDate.toISOString(),
    };

    setLoans((prev) => [...prev, newLoan]);
    setLoanForm({ borrower: "", bookId: "", loanPeriod: 1 });
  };

  const isBookLoaned = (bookId) => {
    return loans.some((loan) => loan.bookId === bookId);
  };

  const getLoanedBook = (bookId) => {
    return loans.find((loan) => loan.bookId === bookId);
  };

  const availableBooks = books.filter((book) => !isBookLoaned(book.isbn13));
  const loanedBooks = loans.map((loan) => {
    const book = books.find((b) => b.isbn13 === loan.bookId);
    return { ...loan, book };
  }).filter((loan) => loan.book);

  return (
    <div className="app">
      <header className="header">
        <img src="logo.svg" alt="Brand Logo" className="logo" />
        <h1>Elf Book Catalog</h1>
      </header>

      <main className="content">
        {currentView === "books" ? (
          <>
            <div className="button-column">
              <button className="view-switch-btn" onClick={() => setCurrentView("loans")}>
                Loan Management
              </button>
              <button className="add-btn" onClick={() => setShowModal(true)}>
                + Add
              </button>
              <button
                className="update-btn"
                onClick={() => {
                  const selected = books.find((b) => b.selected);
                  if (!selected) {
                    alert("Please select a book to update.");
                    return;
                  }
                  setEditingId(selected.isbn13);
                  setFormData({
                    title: selected.title || "",
                    author: selected.author || "",
                    url: selected.url || "",
                    image: selected.image || "",
                    price: selected.price ? String(parseFloat(String(selected.price).replace(/[^0-9.]/g, ""))) : "",
                  });
                  setShowModal(true);
                }}
              >
                Update
              </button>
              <button className="delete-btn" onClick={handleDelete}>
                Delete
              </button>
              <div className="filters" style={{ marginBottom: 16 }}>
                <label>
                  Price Filter:
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="lt10">Under $10</option>
                    <option value="10to20">$10 - $20</option>
                    <option value="gt20">Over $20</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="grid updt">
              {books
                .filter((book) => {
                  if (priceFilter === "all") return true;
                  const priceNum = book.price ? parseFloat(String(book.price).replace(/[^0-9.]/g, "")) : null;
                  if (priceNum == null || Number.isNaN(priceNum)) return false;
                  if (priceFilter === "lt10") return priceNum < 10;
                  if (priceFilter === "10to20") return priceNum >= 10 && priceNum <= 20;
                  if (priceFilter === "gt20") return priceNum > 20;
                  return true;
                })
                .map((book) => (
                  <Book
                    key={book.isbn13}
                    id={book.isbn13}
                    title={book.title}
                    price={book.price}
                    image={book.image}
                    url={book.url}
                    selected={book.selected}
                    onSelect={handleSelect}
                    isLoaned={isBookLoaned(book.isbn13)}
                  />
                ))}
            </div>
          </>
        ) : (
          <div className="loan-management">
            <div className="button-column">
              <button className="view-switch-btn" onClick={() => setCurrentView("books")}>
                Back to Books
              </button>
            </div>
            <div className="loan-content">
              <h2>Loan Management</h2>
              {availableBooks.length > 0 ? (
                <form className="loan-form" onSubmit={handleLoanSubmit}>
                  <label>
                    Borrower Name:
                    <input
                      type="text"
                      name="borrower"
                      value={loanForm.borrower}
                      onChange={handleLoanFormChange}
                      required
                    />
                  </label>
                  <label>
                    Select Book:
                    <select
                      name="bookId"
                      value={loanForm.bookId}
                      onChange={handleLoanFormChange}
                      required
                    >
                      <option value="">-- Select a book --</option>
                      {availableBooks.map((book) => (
                        <option key={book.isbn13} value={book.isbn13}>
                          {book.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Loan Period (weeks):
                    <input
                      type="number"
                      name="loanPeriod"
                      value={loanForm.loanPeriod}
                      onChange={handleLoanFormChange}
                      min="1"
                      max="4"
                      required
                    />
                  </label>
                  <button type="submit" className="submit-loan-btn">Create Loan</button>
                </form>
              ) : (
                <div className="all-books-loaned-message">
                  <p>All books are currently on loan.</p>
                </div>
              )}
              
              {loanedBooks.length > 0 && (
                <div className="loaned-books-section">
                  <h3>Loaned Books</h3>
                  <div className="loaned-books-list">
                    {loanedBooks.map((loan) => (
                      <div key={loan.id} className="loaned-book-item">
                        <p><strong>Borrower:</strong> {loan.borrower}</p>
                        <p><strong>Book:</strong> {loan.book.title}</p>
                        <p><strong>Due Date:</strong> {new Date(loan.dueDate).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2025 Elf Book Catalog. All rights reserved.</p>
      </footer>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingId ? "Update Book" : "Add a New Book"}</h2>
            <form onSubmit={handleAdd}>
              <label>
                Title:
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Author:
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                />
              </label>
              <label>
                Cover Image URL:
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                />
              </label>
              <label>
                Details URL:
                <input
                  type="text"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                />
              </label>
              <label>
                Price (number):
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                />
              </label>

              <div className="modal-actions">
                <button type="submit">Submit</button>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

