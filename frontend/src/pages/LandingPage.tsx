import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import heroImg from "../assets/img1.png";

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h13M13 6l6 6-6 6" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M10 8.5l5 3.5-5 3.5v-7z" />
  </svg>
);

const WarningIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3l9 17H3L12 3z" />
    <path d="M12 9v5M12 17h.01" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  </svg>
);

const PeopleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3.5 20c.5-3.5 2.3-5 5.5-5s5 1.5 5.5 5" />
    <path d="M15 15c2.8 0 4.5 1.3 5 4" />
  </svg>
);

const ResourceIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M8 5V3h8v2M8 10h8M8 14h5" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="8" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M2.5 20c.6-3.7 2.4-5.3 5.5-5.3s5 1.6 5.6 5.3" />
    <path d="M14.5 15c2.7.1 4.3 1.5 4.9 4.5" />
  </svg>
);

const CommunityIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 20h18" />
    <path d="M5 20V10l7-5 7 5v10" />
    <path d="M9 20v-5h6v5M8 10h.01M12 10h.01M16 10h.01" />
  </svg>
);

const AccuracyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v18M3 12h18" />
    <path d="M6 16l3-4 2 2 5-7 2 3" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.2 2.5 3.2 5.5 3.2 9S14.2 18.5 12 21c-2.2-2.5-3.2-5.5-3.2-9S9.8 5.5 12 3z" />
  </svg>
);

const LandingPage = () => {
  return (
    <div className="landing-page">

      <Navbar />

      <main>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="hero-section" id="home">

          <div
            className="hero-background-image"
            style={{
              backgroundImage: `url(${heroImg})`,
            }}
          />

          <div className="hero-dark-overlay" />

          <div className="hero-container">

            <div className="hero-content">

              <div className="hero-kicker">
                <span />
                DISASTER RESILIENCE PLATFORM
              </div>

              <h1>
                Safer
                <br />
                Communities.
                <br />
                <span>Brighter</span>
                <br />
                <span>Tomorrows.</span>
              </h1>

              <p className="hero-description">
                ReliefNexus uses data, AI and community insight
                to predict risks, deliver early warnings and build
                stronger, more resilient communities.
              </p>

              <div className="hero-actions">

                <a
                  href="/register"
                  className="hero-primary"
                >
                  Get Started
                  <ArrowIcon />
                </a>

                <a
                  href="#solutions"
                  className="hero-secondary"
                >
                  <PlayIcon />
                  Explore Solutions
                </a>

              </div>

            </div>


            <div className="hero-message">
              <span>People</span>
              <span>Prepared.</span>
              <span>Protected.</span>
            </div>

          </div>

        </section>


        {/* =================================================
            SOLUTIONS
        ================================================= */}

        <section
          className="feature-strip"
          id="solutions"
        >

          <div className="feature-strip-inner">

            <div className="feature-item">

              <div className="feature-icon">
                <WarningIcon />
              </div>

              <div className="feature-text">
                <strong>Risk Prediction</strong>

                <span>
                  Identify potential risks early with
                  AI-driven analysis.
                </span>
              </div>

            </div>


            <div className="feature-item">

              <div className="feature-icon">
                <BellIcon />
              </div>

              <div className="feature-text">
                <strong>Early Warnings</strong>

                <span>
                  Get timely alerts and act before
                  disaster strikes.
                </span>
              </div>

            </div>


            <div className="feature-item">

              <div className="feature-icon">
                <PeopleIcon />
              </div>

              <div className="feature-text">
                <strong>Vulnerable Communities</strong>

                <span>
                  Identify and support communities
                  that need help most.
                </span>
              </div>

            </div>


            <div className="feature-item">

              <div className="feature-icon">
                <ResourceIcon />
              </div>

              <div className="feature-text">
                <strong>Preparedness & Response</strong>

                <span>
                  Plan better. Respond faster.
                  Save lives.
                </span>
              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            IMPACT
        ================================================= */}

        <section
          className="impact-section"
          id="impact"
        >

          <div className="section-container">

            <div className="impact-heading">

              <span className="section-kicker">
                REAL IMPACT
              </span>

              <h2>
                Real Impact.
                <span>Stronger Communities.</span>
              </h2>

              <p>
                Technology for a safer Sri Lanka and beyond.
              </p>

            </div>


            <div className="impact-stats">

              <div className="impact-stat">

                <div className="impact-icon">
                  <UsersIcon />
                </div>

                <div>
                  <strong>250K+</strong>
                  <span>People Reached</span>
                </div>

              </div>


              <div className="impact-stat">

                <div className="impact-icon">
                  <CommunityIcon />
                </div>

                <div>
                  <strong>120+</strong>
                  <span>Communities</span>
                </div>

              </div>


              <div className="impact-stat">

                <div className="impact-icon">
                  <AccuracyIcon />
                </div>

                <div>
                  <strong>98%</strong>
                  <span>Alert Accuracy</span>
                </div>

              </div>


              <div className="impact-stat">

                <div className="impact-icon">
                  <GlobeIcon />
                </div>

                <div>
                  <strong>15+</strong>
                  <span>Partner Organizations</span>
                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            ABOUT
        ================================================= */}

        <section
          className="shared-section"
          id="about"
        >

          <div className="section-container shared-grid">

            <div className="shared-copy">

              <span className="section-kicker">
                OUR APPROACH
              </span>

              <h2>
                A Safer Future
                <br />
                <span>Is a Shared Effort.</span>
              </h2>

              <p>
                ReliefNexus brings governments, communities
                and disaster-response teams together through
                intelligent, data-driven technology.
              </p>

              <p>
                From risk prediction and vulnerability assessment
                to preparedness and early warning, ReliefNexus
                helps people prepare earlier and respond smarter.
              </p>

              <a
                href="#solutions"
                className="learn-button"
              >
                Explore Solutions
                <ArrowIcon />
              </a>

            </div>


            <div className="shared-image">

              <img
                src={heroImg}
                alt="Community disaster preparedness"
              />

              <div className="shared-image-overlay" />

              <div className="shared-image-caption">

                <span>TOGETHER</span>

                <strong>
                  We Build Resilience
                </strong>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            CONTACT CTA
        ================================================= */}

        <section
          className="contact-section"
          id="contact"
        >

          <div className="contact-container">

            <span className="contact-kicker">
              BUILD A SAFER TOMORROW
            </span>

            <h2>
              Ready to build
              <span> stronger communities?</span>
            </h2>

            <p>
              Join ReliefNexus and help create a smarter,
              safer and more resilient future.
            </p>

            <div className="contact-actions">

              <a
                href="/register"
                className="contact-primary"
              >
                Get Started
                <ArrowIcon />
              </a>

              <a
                href="mailto:info@reliefnexus.com"
                className="contact-secondary"
              >
                Contact Us
              </a>

            </div>

          </div>

        </section>

      </main>

      <Footer />

    </div>
  );
};

export default LandingPage;
