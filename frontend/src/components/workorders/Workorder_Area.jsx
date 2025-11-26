import React, { useState, useEffect } from "react";
import "./css/setuppage.css";

const API_GET_ALL = "http://localhost:5000/api/workorder-areas";
const API_CREATE = "http://localhost:5000/api/workorder-area";

const WorkOrderAreaPage = () => {
  const [formData, setFormData] = useState({
    WORKORDER_AREA: "",
    STATUS: "Active",
  });

  const [areas, setAreas] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({
    WORKORDER_AREA: "",
    STATUS: "",
  });

  const fetchAreas = async () => {
    try {
      const res = await fetch(API_GET_ALL);
      const data = await res.json();
      setAreas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching areas:", error);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ WORKORDER_AREA: "", STATUS: "Active" });
        fetchAreas();
        alert("✅ Work Order Area added successfully!");
      } else {
        alert("❌ Failed to add work order area.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Server error!");
    }
  };

  const handleEdit = (area) => {
    setEditingId(area.id);
    setEditingData({
      WORKORDER_AREA: area.workorder_area,
      STATUS: area.status,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({ WORKORDER_AREA: "", STATUS: "" });
  };

  const handleUpdate = async (id) => {
    try {
      const res = await fetch(`${API_CREATE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingData),
      });

      if (res.ok) {
        setEditingId(null);
        fetchAreas();
        alert("✅ Work Order Area updated!");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`${API_CREATE}/${id}`, { method: "DELETE" });
      if (res.ok) fetchAreas();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="setup-page">
      <div className="page-container">

        {/* ===== Add New Work Order Area ===== */}
        <div className="box-section form-box">
          <h2>Add New Work Order Area</h2>

          <form onSubmit={handleSubmit} className="form-create">
            <div className="form-header-row">
              <div className="form-header-cell">WORK ORDER AREA</div>
              <div className="form-header-cell">STATUS</div>
            </div>

            <div className="form-group">
              <div className="input-with-star">
                <input
                  type="text"
                  name="WORKORDER_AREA"
                  value={formData.WORKORDER_AREA}
                  onChange={handleChange}
                  placeholder="Enter Work Order Area"
                  required
                />
                <span className="required-star">★</span>
              </div>
            </div>

            <div className="form-group">
              <div className="input-with-star">
                <select
                  name="STATUS"
                  value={formData.STATUS}
                  onChange={handleChange}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <span className="required-star">★</span>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Submit</button>
              <button type="button" className="btn-reset" onClick={() => setFormData({ WORKORDER_AREA: "", STATUS: "Active" })}>
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* ===== Existing Work Order Areas ===== */}
        <div className="box-section table-box">
          <h2>Existing Work Order Areas</h2>

          <div className="table-wrapper">
            <div className="fixed-table">
              <table className="workorder-table">
                <thead>
                  <tr>
                    <th>Work Order Area</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {areas.length > 0 ? (
                    areas.map((area) => (
                      <tr key={area.id}>
                        {editingId === area.id ? (
                          <>
                            <td>
                              <input
                                type="text"
                                name="WORKORDER_AREA"
                                value={editingData.WORKORDER_AREA}
                                onChange={handleEditChange}
                              />
                            </td>
                            <td>
                              <select
                                name="STATUS"
                                value={editingData.STATUS}
                                onChange={handleEditChange}
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </td>
                            <td>
                              <button className="btn-save" onClick={() => handleUpdate(area.id)}>Save</button>
                              <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{area.workorder_area}</td>
                            <td>{area.status}</td>
                            <td>
                              <button className="btn-edit" onClick={() => handleEdit(area)}>Edit</button>
                              <button className="btn-delete" onClick={() => handleDelete(area.id)}>Delete</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center", color: "#666" }}>
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WorkOrderAreaPage;
