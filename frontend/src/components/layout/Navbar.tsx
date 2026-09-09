import { useState } from "react";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-navbar">
      <div className="navbar-inner">
        <a href="/" className="brand" onClick={closeMenu}>
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>

          <span className="brand-name">
            Relief<span>Nexus</span>
          </span>
        </a>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <a href="#home" onClick={closeMenu}>Home</a>
          <a href="#solutions" onClick={closeMenu}>Solutions</a>
          <a href="#impact" onClick={closeMenu}>Impact</a>
          <a href="#about" onClick={closeMenu}>About</a>
          <a href="#contact" onClick={closeMenu}>Contact</a>
        </nav>

        <div className="navbar-actions">
          <button className="language-button" type="button">
            EN <span>?</span>
          </button>

          <a href="/login" className="navbar-cta">
            Get Started
            <span>?</span>
          </a>
        </div>

        <button
          className={`mobile-menu-button ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          type="button"
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
