import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import heroImg from "../assets/img1.png";

const LandingPage = () => {
  const solutions = [
    {
      number: "01",
      icon: "?",
      title: "Risk Prediction",
      text: "Analyze environmental and historical data to identify potential disaster risks before they escalate.",
    },
    {
      number: "02",
      icon: "?",
      title: "Vulnerability & Impact",
      text: "Understand vulnerable communities and estimate the potential impact of emerging threats.",
    },
    {
      number: "03",
      icon: "?",
      title: "Preparedness & Resources",
      text: "Monitor preparedness levels, essential resources and allocation requirements.",
    },
    {
      number: "04",
      icon: "?",
      title: "Early Warning & Coordination",
      text: "Deliver timely warnings and coordinate actions between authorities, volunteers and communities.",
    },
  ];

  return (
    <div className="landing-page">
      <Navbar />

      <main>
        {/* HERO */}
        <section className="hero-section" id="home">
          <div className="hero-background">
            <img src={heroImg} alt="Disaster resilience" />
            <div className="hero-overlay" />
          </div>

          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-eyebrow">
                <span className="eyebrow-line" />
                AI-POWERED DISASTER RESILIENCE
              </div>

              <h1>
                Safer Communities.
                <br />
                <span>Brighter Tomorrows.</span>
              </h1>

              <p>
                Predict risks. Prepare communities. Protect lives.
                ReliefNexus brings AI, real-time data and coordinated
                response together to build a safer and more resilient future.
              </p>

              <div className="hero-actions">
                <a href="/login" className="primary-button">
                  Get Started <span>?</span>
                </a>

                <a href="#solutions" className="secondary-button">
                  Explore Platform <span>?</span>
                </a>
              </div>
            </div>

            <div className="hero-ai-card">
              <div className="ai-card-top">
                <span className="live-dot" />
                <span>RELIEFNEXUS AI</span>
                <span className="ai-live">LIVE</span>
              </div>

              <div className="ai-card-main">
                <div className="ai-pulse">
                  <div />
                  <div />
                  <div />
                </div>

                <div>
                  <strong>Risk Intelligence</strong>
                  <small>Monitoring disaster signals</small>
                </div>
              </div>

              <div className="ai-card-bottom">
                <span>STATUS</span>
                <strong>ACTIVE MONITORING</strong>
              </div>
            </div>

            <div className="hero-bottom">
              <div className="hero-scroll">
                <span className="scroll-icon">?</span>
                SCROLL TO EXPLORE
              </div>

              <div className="hero-status">
                <span className="status-dot" />
                INTELLIGENT DISASTER MANAGEMENT
              </div>
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section className="intro-section">
          <div className="section-container">
            <div className="section-label">
              <span />
              OUR MISSION
            </div>

            <div className="intro-grid">
              <h2>
                Turning intelligence
                <br />
                <span>into resilience.</span>
              </h2>

              <div className="intro-text">
                <p>
                  Disasters can happen without warning. But communities
                  don't have to face them unprepared.
                </p>

                <p>
                  ReliefNexus combines predictive intelligence, community
                  data and coordinated action to help people understand risks
                  before they become emergencies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SOLUTIONS */}
        <section className="solutions-section" id="solutions">
          <div className="section-container">
            <div className="section-heading">
              <div>
                <div className="section-label">
                  <span />
                  OUR SOLUTIONS
                </div>

                <h2>
                  One platform.
                  <br />
                  <span>Four powerful capabilities.</span>
                </h2>
              </div>

              <p>
                From predicting risks to coordinating emergency action,
                ReliefNexus connects every stage of disaster resilience.
              </p>
            </div>

            <div className="solutions-grid">
              {solutions.map((solution) => (
                <article
                  className={`solution-card ${
                    solution.number === "01" ? "featured" : ""
                  }`}
                  key={solution.number}
                >
                  <div className="solution-number">{solution.number}</div>

                  <div className="solution-icon">{solution.icon}</div>

                  <h3>{solution.title}</h3>

                  <p>{solution.text}</p>

                  <a href="#">
                    Explore capability <span>?</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* IMPACT */}
        <section className="impact-section" id="impact">
          <div className="impact-glow" />

          <div className="section-container">
            <div className="section-label light">
              <span />
              OUR IMPACT
            </div>

            <div className="impact-heading">
              <h2>
                Technology that
                <br />
                <span>serves people.</span>
              </h2>

              <p>
                Our mission is measured by safer communities, faster
                decisions and better preparedness.
              </p>
            </div>

            <div className="impact-grid">
              <div className="impact-stat">
                <strong>250K+</strong>
                <span>People Reached</span>
              </div>

              <div className="impact-stat">
                <strong>120+</strong>
                <span>Communities</span>
              </div>

              <div className="impact-stat">
                <strong>98%</strong>
                <span>Alert Accuracy</span>
              </div>

              <div className="impact-stat">
                <strong>15+</strong>
                <span>Partner Organizations</span>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="about-section" id="about">
          <div className="section-container">
            <div className="about-grid">
              <div className="about-visual">
                <div className="about-card">
                  <div className="about-card-top">
                    <span>RELIEFNEXUS AI</span>

                    <span className="live-indicator">
                      <i /> LIVE
                    </span>
                  </div>

                  <div className="radar">
                    <div className="radar-ring ring-one" />
                    <div className="radar-ring ring-two" />
                    <div className="radar-ring ring-three" />
                    <div className="radar-line" />
                    <div className="radar-point point-one" />
                    <div className="radar-point point-two" />
                    <div className="radar-point point-three" />
                  </div>

                  <div className="about-card-bottom">
                    <span>COMMUNITY SAFETY</span>
                    <strong>MONITORING</strong>
                  </div>
                </div>
              </div>

              <div className="about-content">
                <div className="section-label">
                  <span />
                  ABOUT RELIEFNEXUS
                </div>

                <h2>
                  A safer future
                  <br />
                  <span>is a shared effort.</span>
                </h2>

                <p>
                  ReliefNexus is an AI-powered disaster management platform
                  designed to connect people, data and intelligent systems.
                </p>

                <p>
                  By combining risk prediction, vulnerability assessment,
                  preparedness planning and early warning coordination, we
                  help decision-makers act with greater confidence.
                </p>

                <a href="#contact" className="text-button">
                  Learn more about us <span>?</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section" id="contact">
          <div className="cta-container">
            <div className="cta-label">READY WHEN IT MATTERS MOST</div>

            <h2>
              Prepare today.
              <br />
              <span>Protect tomorrow.</span>
            </h2>

            <p>Join a smarter approach to disaster resilience.</p>

            <a href="/login" className="primary-button cta-button">
              Get Started <span>?</span>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
