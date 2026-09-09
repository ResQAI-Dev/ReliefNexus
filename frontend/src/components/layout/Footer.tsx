import { useState } from "react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-container">
        <a href="/" className="navbar-brand">
          <div className="brand-mark">
            <span className="brand-mark-inner">+</span>
          </div>

          <div className="brand-text">
            <span className="brand-name">ReliefNexus</span>
            <span className="brand-tagline">DISASTER RESILIENCE</span>
          </div>
        </a>

        <nav className={`navbar-nav ${menuOpen ? "open" : ""}`}>
          <a href="#home" onClick={() => setMenuOpen(false)}>
            Home
          </a>

          <a href="#solutions" onClick={() => setMenuOpen(false)}>
            Solutions
          </a>

          <a href="#impact" onClick={() => setMenuOpen(false)}>
            Impact
          </a>

          <a href="#about" onClick={() => setMenuOpen(false)}>
            About
          </a>

          <a href="#contact" onClick={() => setMenuOpen(false)}>
            Contact
          </a>
        </nav>

        <div className="navbar-actions">
          <button className="language-button">
            EN
            <span>⌄</span>
          </button>

          <a href="/login" className="nav-cta">
            Get Started
            <span>→</span>
          </a>
        </div>

        <button
          className="mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
};

export default Navbar;