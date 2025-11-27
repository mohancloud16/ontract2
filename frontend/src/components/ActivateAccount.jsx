import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./css/activateAccount.css";
import { BASE_URLS } from "../api";

function ActivateAccount({ setUser }) {
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) setError("Invalid or missing activation link");
  }, [token]);

  const handleActivate = async (e) => {
    e.preventDefault();

    try {
      const endpoint = `${BASE_URLS.user}/api/activate`;
      console.log("Activate endpoint:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setActivated(true);

        if (data.email) {
          localStorage.setItem("user", JSON.stringify({ email: data.email }));
          setUser({ email: data.email });
        }

        setTimeout(() => navigate("/provider_home/profile"), 1500);
      } else {
        setError(data.error || "Activation failed.");
      }
    } catch (err) {
      console.error("Activate error:", err);
      setError("Unable to contact server.");
    }
  };

  if (error)
    return (
      <div className="activate-container" style={{ color: "red" }}>
        {error}
      </div>
    );

  return (
    <div className="activate-container">
      <h2 className="activate-title">Account Activation</h2>

      {!activated ? (
        <form onSubmit={handleActivate} className="activate-form">
          <p>Do you want to activate your account?</p>
          <div className="activate-buttons">
            <button type="submit" className="activate-yes">
              Yes
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="activate-no"
            >
              No
            </button>
          </div>
        </form>
      ) : (
        <p className="activate-success">✔ Account Activated — Redirecting...</p>
      )}
    </div>
  );
}

export default ActivateAccount;

