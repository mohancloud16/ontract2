import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import "./css/signup.css";
import { BASE_URLS } from "../api";

function Signup() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const recaptchaRef = useRef();
  const navigate = useNavigate();

  const RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

  // ---------------------- VALIDATION ----------------------
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required.";
    } else if (!/^\d+$/.test(phoneNumber)) {
      errors.phoneNumber = "Phone number must contain only digits.";
    } else if (phoneNumber.length !== 10) {
      errors.phoneNumber = "Please enter exactly 10 digits.";
    }

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email.";
    }

    if (!password.trim()) {
      errors.password = "Password is required.";
    } else {
      if (password.length < 8) errors.password = "Password must be at least 8 characters.";
      else if (!/[A-Z]/.test(password)) errors.password = "Must contain uppercase letter.";
      else if (!/[a-z]/.test(password)) errors.password = "Must contain lowercase letter.";
      else if (!/[0-9]/.test(password)) errors.password = "Must contain at least one number.";
      else if (!/[^A-Za-z0-9]/.test(password)) errors.password = "Must contain special character.";
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (!captchaToken) {
      errors.captcha = "Please complete the captcha verification.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------------------- SUBMIT ----------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      // ✅ Correct backend endpoint for provider signup in production
      const endpoint = `${BASE_URLS.user}/api/signup`;
      console.log("Signup endpoint:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phoneNumber,
          email,
          password,
          captcha_token: captchaToken,
        }),
      });

      const rawText = await response.text();
      let data;

      try {
        data = JSON.parse(rawText);
      } catch {
        data = { error: rawText };
      }

      if (response.ok) {
        navigate("/login", {
          state: { message: "Activation link sent to email. Please verify before login." },
        });

        setPhoneNumber("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
      } else {
        setError(data.error || "Signup failed.");
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Unable to connect to server. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2 className="signup-title">Create Account</h2>
        <p className="signup-subtitle">Join us today</p>

        {error && <p className="signup-error">{error}</p>}

        <form onSubmit={handleSubmit} className="signup-form">
          {/* Phone */}
          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              disabled={loading}
            />
            {fieldErrors.phoneNumber && <span className="error-text">{fieldErrors.phoneNumber}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              disabled={loading}
            />
            {fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group password-group">
            <label>Password *</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="Create password"
              />
              <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
            {fieldErrors.password && <span className="error-text">{fieldErrors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group password-group">
            <label>Confirm Password *</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="Confirm password"
              />
              <span
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
            {fieldErrors.confirmPassword && (
              <span className="error-text">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          {/* Captcha */}
          <div className="form-group captcha-group">
            <label>Verification</label>
            <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} onChange={setCaptchaToken} />
            {fieldErrors.captcha && <span className="error-text">{fieldErrors.captcha}</span>}
          </div>

          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <p className="login-link">
          Already have an account?
          <Link to="/login" className="link"> Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;

