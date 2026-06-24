import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, verifyOtp, resendOtp, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID_HERE") return;

    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          width: googleBtnRef.current.offsetWidth || 340,
          text: "signin_with",
          shape: "rectangular",
        });
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) { initGoogle(); clearInterval(interval); }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  const handleGoogleCallback = async (response) => {
    setGoogleLoading(true);
    setError("");
    const result = await googleLogin(response.credential);
    setGoogleLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate("/");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    const result = await login(email.trim().toLowerCase(), password);
    if (result.error) {
      setError(result.error);
    } else if (result.needsVerification) {
      setUserId(result.userId);
      setOtpStep(true);
    } else {
      navigate("/");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }
    const result = await verifyOtp(userId, otp.trim());
    if (result.error) {
      setError(result.error);
    } else {
      navigate("/");
    }
  };

  const handleResend = async () => {
    setError("");
    setResendMsg("");
    const result = await resendOtp(userId);
    if (result.error) {
      setError(result.error);
    } else {
      setResendMsg("OTP resent!");
      setTimeout(() => setResendMsg(""), 3000);
    }
  };

  if (otpStep) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <h1>Verify Your Email</h1>
            <p>We sent a 6-digit code to your email</p>
          </div>

          <form onSubmit={handleVerify} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            {resendMsg && <div className="auth-success" style={{ color: "green", marginBottom: "1rem", textAlign: "center" }}>{resendMsg}</div>}

            <div className="auth-field">
              <label>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit">
              Verify
            </button>
          </form>

          <p className="auth-footer">
            Didn't receive the code?{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); handleResend(); }}>
              Resend OTP
            </a>
          </p>
        </div>
      </div>
    );
  }

  const googleConfigured = import.meta.env.VITE_GOOGLE_CLIENT_ID &&
    import.meta.env.VITE_GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID_HERE";

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <h1>Welcome Back</h1>
          <p>Log in to your InkFlow account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {googleConfigured ? (
          <>
            <div ref={googleBtnRef} className="google-btn-wrapper" />
            {googleLoading && <p className="auth-google-loading">Signing in with Google…</p>}
            <div className="auth-divider">
              <span>or</span>
            </div>
          </>
        ) : (
          <div className="auth-google-placeholder">
            <span>⚠️ Add <code>VITE_GOOGLE_CLIENT_ID</code> to <code>.env</code> to enable Google Sign-In</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit">
            Log In
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
