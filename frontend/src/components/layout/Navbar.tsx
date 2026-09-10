import { useEffect, useState } from "react";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 760) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <header className="site-navbar">

      <div className="navbar-inner">

        <a
          href="#home"
          className="brand"
          onClick={closeMenu}
        >
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>

          <span className="brand-name">
            Relief<span>Nexus</span>
          </span>
        </a>


        <nav
          className={`nav-links ${menuOpen ? "open" : ""}`}
          aria-label="Main navigation"
        >
          <a href="#home" onClick={closeMenu}>
            Home
          </a>

          <a href="#services" onClick={closeMenu}>
            Solutions
          </a>

          <a href="#impact" onClick={closeMenu}>
            Impact
          </a>

          <a href="#about" onClick={closeMenu}>
            About
          </a>

          <a href="#contact" onClick={closeMenu}>
            Contact
          </a>
        </nav>


        <div className="navbar-actions">

          <button
            className="language-button"
            type="button"
            aria-label="Select language"
          >
            EN
            <span>⌄</span>
          </button>

          <a
            href="/login"
            className="navbar-cta"
          >
            Get Started
          </a>

        </div>


        <button
          className={`mobile-menu-button ${
            menuOpen ? "active" : ""
          }`}
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label={
            menuOpen
              ? "Close navigation"
              : "Open navigation"
          }
          aria-expanded={menuOpen}
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
