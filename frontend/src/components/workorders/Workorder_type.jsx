import React, { useState, useEffect } from "react";
import "./css/setuppage.css";

const API_URL = "http://localhost:5000/api/workorder-type";

const WorkOrderTypePage = () => {
  const [formData, setFormData] = useState({
    WORKORDER_TYPE: "",
    STATUS: "Active",
  });
  const [types, setTypes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({
    WORKORDER_TYPE: "",
    STATUS: "",
  });

  const fetchTypes = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTypes(data);
    } catch (error) {
      console.error("Error fetching types:", error);
    }
  };

  useEffect(() => {
    fetchTypes();
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
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ WORKORDER_TYPE: "", STATUS: "Active" });
        fetchTypes();
        alert("✅ Work Order Type added successfully!");
      } else {
        alert("❌ Failed to add work order type.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Server error!");
    }
  };

  const handleEdit = (type) => {
    setEditingId(type.id);
    setEditingData({
      WORKORDER_TYPE: type.workorder_type,
      STATUS: type.status,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({ WORKORDER_TYPE: "", STATUS: "" });
  };

  const handleUpdate = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingData),
      });

      if (res.ok) {
        setEditingId(null);
        fetchTypes();
        alert("✅ Work Order Type updated!");
      } else {
        alert("❌ Failed to update.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Server error!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTypes();
        alert("✅ Work Order Type deleted!");
      } else {
        alert("❌ Failed to delete.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Server error!");
    }
  };

  const handleReset = () => {
    setFormData({ WORKORDER_TYPE: "", STATUS: "Active" });
  };

  return (
    <div className="setup-page">
      <div className="page-container">
        {/* ===== Add New Work Type ===== */}
        <div className="box-section form-box">
          <h2>Add New Work Type</h2>
          <form onSubmit={handleSubmit} className="form-create">
            <div className="form-header-row">
              <div className="form-header-cell">WORK ORDER TYPE</div>
              <div className="form-header-cell">STATUS</div>
            </div>

            <div className="form-group">
              <div className="input-with-star">
                <input
                  type="text"
                  name="WORKORDER_TYPE"
                  value={formData.WORKORDER_TYPE}
                  onChange={handleChange}
                  placeholder="Enter Work Order Type"
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
              <button type="submit" className="btn-primary">
                Submit
              </button>
              <button type="button" className="btn-reset" onClick={handleReset}>
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* ===== Existing Work Order Types ===== */}
        <div className="box-section table-box">
          <h2>Existing Work Order Types</h2>
          <div className="table-wrapper">
            <div className="fixed-table">
              <table className="workorder-table">
                <thead>
                  <tr>
                    <th>Work Order Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {types.length > 0 ? (
                    types.map((type) => (
                      <tr key={type.id}>
                        {editingId === type.id ? (
                          <>
                            <td>
                              <input
                                type="text"
                                name="WORKORDER_TYPE"
                                value={editingData.WORKORDER_TYPE}
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
                              <button
                                className="btn-save"
                                onClick={() => handleUpdate(type.id)}
                              >
                                Save
                              </button>
                              <button
                                className="btn-cancel"
                                onClick={handleCancel}
                              >
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{type.workorder_type}</td>
                            <td>{type.status}</td>
                            <td>
                              <button
                                className="btn-edit"
                                onClick={() => handleEdit(type)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => handleDelete(type.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        style={{ textAlign: "center", color: "#666" }}
                      >
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

export default WorkOrderTypePage;