import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import "./App.css";

/* Common / Individual */
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import OTPVerification from "./components/OTPVerification";
import ActivateAccount from "./components/ActivateAccount";
import ProviderProfile from "./components/ProviderProfile";
import ProviderServices from "./components/ProviderServices";
import ProviderHome from "./components/ProviderHome";
import ForgotPassword from "./components/ForgotPassword";

/* Admin */
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

/* Contractor (company) */
import CompanyLogin from "./components/company/CompanyLogin";
import CompanySignup from "./components/company/CompanySignup";
import CompanyActivateAccount from "./components/company/CompanyActivateAccount";
import CompanyOTPVerification from "./components/company/CompanyOTPVerification";
import CompanyDashboardHome from "./components/company/CompanyDashboardHome";
import CompanyProfile from "./components/company/CompanyProfile";
import CompanyServices from "./components/company/CompanyServices";
import CompanyNotifications from "./components/company/CompanyNotifications";

import Notifications from "./components/Notifications";
import AdminApp from "./components/AdminApp";
import CompanyApp from "./components/company/CompanyApp";

function Layout({ user, setUser, admin, setAdmin, contractor, setContractor }) {
  const location = useLocation();

  // Hide layout on dashboard paths
  const hideLayout =
    location.pathname.startsWith("/provider") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/contractor/dashboard");

  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  const loginRef = useRef(null);
  const signupRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (
        loginRef.current &&
        !loginRef.current.contains(e.target) &&
        signupRef.current &&
        !signupRef.current.contains(e.target)
      ) {
        setLoginOpen(false);
        setSignupOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="min-h-screen d-flex flex-column">

      {/* NAVBAR */}
      {!hideLayout && (
        <nav className="navbar navbar-expand-lg sticky-top bg-light shadow-sm">
          <div className="container">
            <Link className="navbar-brand fw-bold" to="/">
              Ontract Services
            </Link>

            <button
              className="navbar-toggler"
              type="button"
              onClick={() => {
                setLoginOpen(false);
                setSignupOpen(false);
              }}
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto align-items-center">

                <li className="nav-item">
                  <Link className="nav-link" to="/">Home</Link>
                </li>

                {/* LOGIN DROPDOWN */}
                <li className="nav-item dropdown" ref={loginRef}>
                  <button
                    className="nav-link btn dropdown-toggle"
                    onClick={() => {
                      setSignupOpen(false);
                      setLoginOpen(!loginOpen);
                    }}
                  >
                    Login
                  </button>

                  {loginOpen && (
                    <ul className="dropdown-menu show dropdown-menu-end mt-2">
                      <li>
                        <Link
                          className="dropdown-item"
                          to="/login"
                          onClick={() => setLoginOpen(false)}
                        >
                          Individual
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="/contractor/login"
                          onClick={() => setLoginOpen(false)}
                        >
                          Contractor
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                {/* SIGNUP DROPDOWN */}
                <li className="nav-item dropdown ms-2" ref={signupRef}>
                  <button
                    className="nav-link btn dropdown-toggle"
                    onClick={() => {
                      setLoginOpen(false);
                      setSignupOpen(!signupOpen);
                    }}
                  >
                    Sign Up
                  </button>

                  {signupOpen && (
                    <ul className="dropdown-menu show dropdown-menu-end mt-2">
                      <li>
                        <Link
                          className="dropdown-item"
                          to="/signup"
                          onClick={() => setSignupOpen(false)}
                        >
                          Individual
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="/contractor/signup"
                          onClick={() => setSignupOpen(false)}
                        >
                          Contractor
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

              </ul>
            </div>
          </div>
        </nav>
      )}

      {/* ROUTES */}
      <main className="flex-fill">
        <Routes>

          {/* User */}
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<OTPVerification setUser={setUser} />} />
          <Route path="/activate" element={<ActivateAccount setUser={setUser} />} />
          <Route path="/forgot_password" element={<ForgotPassword />} />

          {/* Provider */}
          <Route path="/provider_home" element={<ProviderHome user={user} />}>
            <Route path="profile" element={<ProviderProfile user={user} />} />
            <Route path="services" element={<ProviderServices user={user} />} />
            <Route
              path="notifications"
              element={<Notifications user={user} />}
            />
          </Route>

          {/* Contractor */}
          <Route
            path="/contractor/login"
            element={<CompanyLogin setContractor={setContractor} />}
          />
          <Route path="/contractor/signup" element={<CompanySignup />} />
          <Route
            path="/contractor/activate"
            element={<CompanyActivateAccount setContractor={setContractor} />}
          />
          <Route
            path="/contractor/verify_otp"
            element={<CompanyOTPVerification setContractor={setContractor} />}
          />

          <Route
            path="/contractor/dashboard"
            element={
              <CompanyApp
                contractor={contractor}
                setContractor={setContractor}
              />
            }
          >
            <Route path="home" element={<CompanyDashboardHome />} />
            <Route path="profile" element={<CompanyProfile />} />
            <Route path="services" element={<CompanyServices />} />
            <Route
              path="notifications"
              element={<CompanyNotifications />}
            />
          </Route>

          {/* Admin */}
          <Route
            path="/admin/*"
            element={<AdminApp admin={admin} setAdmin={setAdmin} />}
          />
          <Route
            path="/admin/login"
            element={<AdminLogin setAdmin={setAdmin} />}
          />

        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [contractor, setContractor] = useState(null);

  // Restore session from localStorage
  useEffect(() => {
    const load = (key) => {
      const stored = localStorage.getItem(key);
      return stored && stored !== "undefined" ? JSON.parse(stored) : null;
    };

    setUser(load("user"));
    setAdmin(load("admin"));
    setContractor(load("contractor"));
  }, []);

  return (
    <Layout
      user={user}
      setUser={setUser}
      admin={admin}
      setAdmin={setAdmin}
      contractor={contractor}
      setContractor={setContractor}
    />
  );
}

