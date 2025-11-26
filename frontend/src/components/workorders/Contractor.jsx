// src/pages/Contractor.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/contractor.css";

const WorkOrders = () => {
  const [workorders, setWorkorders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

const fetchWorkOrders = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/workorders/");
    if (!response.ok) throw new Error("Failed to fetch workorders");
    const data = await response.json();

    const formattedData = data.map((wo) => ({
      ...wo,
      RATE: wo.RATE || { total_rate: 0, type_rates: {} },
    }));

    // ✅ Only show workorders that are NOT accepted
    const filteredData = formattedData.filter(
      (wo) => (wo.STATUS || "").toLowerCase() !== "accepted"
    );

    setWorkorders(filteredData);
    setLoading(false);
  } catch (err) {
    setError(err.message);
    setLoading(false);
  }
};


  useEffect(() => {
    fetchWorkOrders();
  }, []);

  if (loading) return <div className="center">Loading workorders...</div>;
  if (error) return <div className="center error">Error: {error}</div>;

  const handleWorkOrderClick = (id) => {
    navigate(`/workorders/${id}`);
  };

  return (
    <div className="workorders-fullpage-container">
      <div className="workorders-content">
        <h2>Work Orders List</h2>
        <div className="table-wrapper">
          <table className="workorders-table">
            <thead>
              <tr>
                <th>Work Order</th>
                <th>Type</th>
                <th>Area</th>
                <th>Status</th>
                <th>Requested Time Closing</th>
                <th>Remarks</th>
               
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {workorders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No workorders found
                  </td>
                </tr>
              ) : (
                workorders.map((wo) => (
                  <tr key={wo.id}>
                    <td
                      className="workorder-link"
                      onClick={() => handleWorkOrderClick(wo.id)}
                    >
                      {wo.WORKORDER}
                    </td>
                    <td>{wo.WORKORDER_TYPE}</td>
                    <td>{wo.WORKORDER_AREA}</td>
                    <td className={`status ${wo.STATUS?.toLowerCase()}`}>
                      {wo.STATUS}
                    </td>
                    <td>{wo.REQUESTED_TIME_CLOSING}</td>
                    <td>{wo.REMARKS}</td>
                 
                    <td>
                      {wo.CREATED_T
                        ? new Date(wo.CREATED_T).toLocaleString()
                        : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkOrders;
