import { Link, useLocation } from "react-router-dom";

const PendingPage = () => {

  const location = useLocation();

  const email =
    location.state?.email || "your email address";

  return (
    <div className="pending-page">

      <div className="pending-card">

        <Link to="/" className="pending-logo">

          <span className="auth-brand-mark">
            <span />
            <span />
            <span />
          </span>

          <span>
            Relief<span>Nexus</span>
          </span>

        </Link>


        <div className="pending-icon">
          ✓
        </div>


        <span className="auth-small-title">
          REGISTRATION SUBMITTED
        </span>


        <h1>
          Your account is
          <span> awaiting approval.</span>
        </h1>


        <p>
          Thank you for joining ReliefNexus.
          Your registration has been submitted
          successfully.
        </p>

        <p>
          A System Administrator needs to review
          and approve your selected role before
          you can sign in.
        </p>


        <div className="pending-email">
          <small>Registered email</small>
          <strong>{email}</strong>
        </div>


        <div className="pending-steps">

          <div className="pending-step active">
            <span>1</span>
            <div>
              <strong>Registration submitted</strong>
              <small>Completed</small>
            </div>
          </div>


          <div className="pending-line" />


          <div className="pending-step">
            <span>2</span>
            <div>
              <strong>Administrator review</strong>
              <small>Pending</small>
            </div>
          </div>


          <div className="pending-line" />


          <div className="pending-step">
            <span>3</span>
            <div>
              <strong>Account activated</strong>
              <small>After approval</small>
            </div>
          </div>

        </div>


        <Link
          to="/login"
          className="pending-button"
        >
          Go to Sign In
          <span>→</span>
        </Link>


        <Link
          to="/"
          className="pending-home"
        >
          Back to ReliefNexus
        </Link>

      </div>

    </div>
  );
};

export default PendingPage;
