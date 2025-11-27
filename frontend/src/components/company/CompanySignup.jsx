// frontend/src/components/company/CompanySignup.jsx
import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import "./css/CompanySignup.css";
import { BASE_URLS } from "../../api";

function CompanySignup() {
  const [companyName, setCompanyName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
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

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!companyName.trim()) {
      errors.companyName = "Company Name is required.";
    }

    if (!registrationNumber.trim()) {
      errors.registrationNumber = "Business Registration Number is required.";
    }

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      errors.email = "Invalid email format.";
    }

    if (!phoneNumber.trim()) {
      errors.phoneNumber = "Phone Number is required.";
    } else if (!/^\d{10}$/.test(phoneNumber)) {
      errors.phoneNumber = "Phone number must be exactly 10 digits.";
    }

    if (!password.trim()) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Confirm password required.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (!captchaToken) {
      errors.captcha = "Captcha is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;
    setLoading(true);

    const payload = {
      company_name: companyName,
      business_registration_number: registrationNumber, // 🔥 KEY MATCHES BACKEND
      email: email,
      phone_number: phoneNumber,
      password: password,
      captcha_token: captchaToken,
    };

    console.log("Sending payload:", payload);

    try {
      const response = await fetch(
        `${BASE_URLS.user}/api/contractor/contractor_signup`,
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }

      console.log("STATUS:", response.status);
      console.log("RESPONSE:", data);

      if (response.ok) {
        navigate("/contractor/login", {
          state: {
            message:
              "Activation link sent to your email. Please verify before login.",
          },
        });

        setCompanyName("");
        setRegistrationNumber("");
        setEmail("");
        setPhoneNumber("");
        setPassword("");
        setConfirmPassword("");
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
      } else {
        setError(data.error || "Registration failed.");
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
      }
    } catch (err) {
      console.error("NETWORK ERROR:", err);
      setError("Backend not responding on port 5000.");
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const onCaptchaChange = (token) => {
    setCaptchaToken(token);
    if (token) {
      setFieldErrors((prev) => ({ ...prev, captcha: "" }));
    }
  };

  const preventPaste = (e) => e.preventDefault();

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2 className="signup-title">Contractor Registration</h2>
        <p className="signup-subtitle">Register your company</p>

        {error && <p className="signup-error">{error}</p>}

        <form onSubmit={handleSubmit} className="signup-form">
          {/* Company name */}
          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={loading}
            />
            {fieldErrors.companyName && (
              <span className="error-text">{fieldErrors.companyName}</span>
            )}
          </div>

          {/* Registration Number */}
          <div className="form-group">
            <label>Registration Number *</label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              disabled={loading}
            />
            {fieldErrors.registrationNumber && (
              <span className="error-text">{fieldErrors.registrationNumber}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            {fieldErrors.email && (
              <span className="error-text">{fieldErrors.email}</span>
            )}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Phone *</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
            />
            {fieldErrors.phoneNumber && (
              <span className="error-text">{fieldErrors.phoneNumber}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group password-group">
            <label>Password *</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onPaste={preventPaste}
                disabled={loading}
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
            {fieldErrors.password && (
              <span className="error-text">{fieldErrors.password}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group password-group">
            <label>Confirm Password *</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onPaste={preventPaste}
                disabled={loading}
              />
              <span
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </span>
            </div>
            {fieldErrors.confirmPassword && (
              <span className="error-text">
                {fieldErrors.confirmPassword}
              </span>
            )}
          </div>

          {/* Captcha */}
          <div className="form-group captcha-group">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={onCaptchaChange}
            />
            {fieldErrors.captcha && (
              <span className="error-text">{fieldErrors.captcha}</span>
            )}
          </div>

          <button
            type="submit"
            className="signup-button"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="login-link">
          Already registered?
          <Link to="/contractor/login" className="link">
            {" "}
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default CompanySignup;
