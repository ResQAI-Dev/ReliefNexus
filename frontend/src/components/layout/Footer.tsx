const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-main">

        <div className="footer-brand">
          <a href="#home" className="footer-logo">
            <span className="footer-logo-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>

            <span className="footer-logo-name">
              Relief<span>Nexus</span>
            </span>
          </a>

          <p>
            AI-powered disaster intelligence for safer,
            stronger and more resilient communities.
          </p>

          <div className="footer-status">
            <span />
            Intelligent Disaster Management
          </div>
        </div>

        <div className="footer-column">
          <h4>Platform</h4>
          <a href="#services">Risk Prediction</a>
          <a href="#services">Vulnerability & Impact</a>
          <a href="#services">Preparedness & Resources</a>
          <a href="#services">Early Warning</a>
        </div>

        <div className="footer-column">
          <h4>Explore</h4>
          <a href="#home">Home</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#impact">Impact</a>
          <a href="#about">About Us</a>
        </div>

        <div className="footer-column">
          <h4>Get Started</h4>
          <a href="/login">Sign In</a>
          <a href="/register">Create Account</a>
          <a href="#contact">Contact Us</a>
        </div>

      </div>

      <div className="footer-bottom">
        <span>
          © 2026 ReliefNexus. All rights reserved.
        </span>

        <div className="footer-bottom-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>

        <span className="footer-built">
          AI for a safer tomorrow.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
