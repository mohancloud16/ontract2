import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./css/workorderdetails.css";

const WorkOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Fetch work order details + contractors
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/workorders/${id}`);
        if (!res.ok) throw new Error("Failed to fetch work order details");
        const data = await res.json();

        data.RATE = data.RATE || { total_rate: 0, type_rates: {} };
        setDetails(data);

        if (data.WORKORDER_AREA) {
          const cRes = await fetch(
            `http://localhost:5000/api/workorders/contractors/by-area/${encodeURIComponent(
              data.WORKORDER_AREA
            )}`
          );
          if (cRes.ok) {
            const contractorsData = await cRes.json();
            setContractors(contractorsData);
          } else {
            setContractors([]);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  // ✅ Handle dropdown changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "CONTRACTOR_NAME") {
      const selected = contractors.find((c) => c.full_name === value);
      setDetails((prev) => ({
        ...prev,
        CONTRACTOR_NAME: selected?.full_name || "",
        CONTRACTOR_RATE: selected?.rate || "",
        CONTRACTOR_ID: selected?.provider_id || "",
        CONTRACTOR_EMAIL: selected?.email_id || "",
      }));
    } else {
      setDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Assign contractor
  const handleSave = async () => {
    if (!details) return;

    // Validation — show browser alert like your screenshot
    if (!details.CONTRACTOR_NAME || details.CONTRACTOR_NAME.trim() === "") {
      window.alert("⚠️ Please select a contractor before assigning.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Update work order
      const updateRes = await fetch(`http://localhost:5000/api/workorders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      if (!updateRes.ok) throw new Error("Failed to update work order");

      // Send acceptance mail
      if (details.CONTRACTOR_ID) {
        const mailRes = await fetch(
          `http://localhost:5000/api/workorders/send-acceptance-mail/${id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              CONTRACTOR_ID: details.CONTRACTOR_ID,
              CONTRACTOR_EMAIL: details.CONTRACTOR_EMAIL,
              CONTRACTOR_NAME: details.CONTRACTOR_NAME,
              workorder: details.WORKORDER,
            }),
          }
        );

        if (!mailRes.ok) {
          const errText = await mailRes.text();
          throw new Error("Failed to send email: " + errText);
        }
      }

      // ✅ Direct native alert (like screenshot)
      window.alert(" Email sent to contractor for acceptance");
    } catch (err) {
      console.error("Error in handleSave:", err);
      setError(err.message);
      window.alert("❌ Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Cancel button → go back
  const handleCancel = () => navigate(-1);

  if (loading) return <div className="center">Loading details...</div>;
  if (error) return <div className="center error">Error: {error}</div>;
  if (!details) return <div className="center">No details found</div>;

  return (
    <div className="workorders-container">
      {error && <div className="error-msg">{error}</div>}

      {/* --- Main Card --- */}
      <div className="section-card">
        <div className="section-header left-header">
          Work Order Details - {details.WORKORDER}
        </div>

        <div className="section-content">
          {/* Row 1 */}
          <div className="wo-header-row">
            <div>Work Order</div>
            <div>Type</div>
            <div>Area</div>
          </div>
          <div className="wo-value-row">
            <div>{details.WORKORDER}</div>
            <div>{details.WORKORDER_TYPE}</div>
            <div>{details.WORKORDER_AREA}</div>
          </div>

          {/* Row 2 */}
          <div className="wo-header-row">
            <div>Status</div>
            <div>Remarks</div>
            <div>Client</div>
          </div>
          <div className="wo-value-row" style={{ gridTemplateColumns: "1fr 2fr" }}>
            <div className={`status ${details.STATUS?.toLowerCase()}`}>
              {details.STATUS}
            </div>
            <div>{details.REMARKS || "-"}</div>
            <div className="client-display">{details.CLIENT || "-"}</div>
          </div>

          {/* Contractor Dropdown */}
          <div className="wo-header-row">
            <div>Contractor Name</div>
          </div>
          <div className="wo-value-row">
            <div>
              {contractors.length > 0 ? (
                <select
                  name="CONTRACTOR_NAME"
                  value={details.CONTRACTOR_NAME || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Contractor --</option>
                  {contractors.map((c) => (
                    <option key={c.provider_id} value={c.full_name}>
                      {c.full_name} — ({c.service_locations})
                    </option>
                  ))}
                </select>
              ) : (
                <em>No contractors found for this area.</em>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Action Buttons --- */}
      <div className="wo-actions-center">
        <button className="blue-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "💾 Assign Contractor"}
        </button>
        <button type="button" className="blue-btn cancel" onClick={handleCancel}>
          ✖ Cancel
        </button>
      </div>
    </div>
  );
};

export default WorkOrderDetails;