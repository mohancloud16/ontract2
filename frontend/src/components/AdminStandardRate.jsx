import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/AdminStandardRate.css";  // optional styling
import { BASE_URLS } from "../api";



export default function AdminStandardRates() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);

  // filters
  const [tradeFilter, setTradeFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("");


  // upload
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  // modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  //validations
  const [errors, setErrors] = useState({});

  // form fields
  const emptyForm = {
    trade: "",
    category_item: "",
    equipment_type: "",
    sub_type: "",
    brand: "",
    description: "",
    unit: "",
    copper_pipe_price: "",
    price_rm: "",
    client: "", 
    extra_col: "",
    source_row_number: null,
  };
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  // Fetch Data
  useEffect(() => {
    fetchRates();
  }, [page, tradeFilter, catFilter,clientFilter, search]);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        trade: tradeFilter || undefined,
        category_item: catFilter || undefined,
        client: clientFilter || undefined,
        search: search || undefined,
      };

      const res = await axios.get(`${BASE_URLS.admin}/api/admin/standard_rates`, { params });
      setRates(res.data.results);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Error fetching rates:", err);
    }
    setLoading(false);
  };

  // Upload Excel
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return alert("Please select an Excel file");

    const fd = new FormData();
    fd.append("file", uploadFile);

    try {
      const res = await axios.post(
        `${BASE_URLS.admin}/api/admin/standard_rates/upload_excel`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log(res);
      setUploadResult(res.data.result);
      alert("Upload Completed");
      setUploadFile(null);
      fetchRates();
    } catch (err) {
      alert(err.response?.data?.error || "Upload failed");
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setEditId(null);
    setShowModal(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.category_item || form.category_item.trim() === "") {
      newErrors.category_item = "Category Item is required";
    }

    // if (!form.trade || form.trade.trim() === "") {
    //   newErrors.trade = "Trade is required";
    // }

    if (!form.description || form.description.trim() === "") {
      newErrors.description = "Description is required";
    }

    // Add more required validations if needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  // Open Edit Modal
  const openEditModal = (row) => {
    setIsEditing(true);
    setEditId(row.id);
    setForm({
      trade: row.trade || "",
      category_item: row.category_item || "",
      equipment_type: row.equipment_type || "",
      sub_type: row.sub_type || "",
      brand: row.brand || "",
      description: row.description || "",
      unit: row.unit || "",
      copper_pipe_price: row.copper_pipe_price || "",
      price_rm: row.price_rm || "",
      client: row.client || "",
      extra_col: row.extra_col || "",
      source_row_number: row.source_row_number || null,
    });
    setErrors({});
    setShowModal(true);
  };

  // Submit add/update
  const handleSave = async () => {
    try {
      if (!validateForm()) return;
      if (isEditing) {
        await axios.put(`${BASE_URLS.admin}/api/admin/standard_rates/${editId}`, form);
        alert("Updated successfully");
      } else {
        await axios.post(`${BASE_URLS.admin}/api/admin/standard_rates`, form);
        alert("Added successfully");
      }
      setShowModal(false);
      fetchRates();
    } catch (err) {
      alert(err.response?.data?.error || "Operation failed");
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete this record?")) return;
    try {
      await axios.delete(`${BASE_URLS.admin}/api/admin/standard_rates/${id}`);
      fetchRates();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Standard Rate Management (SOR)</h2>

      {/* Excel Upload */}
      <div className="card p-3 mb-4">
        <h5>Upload Excel</h5>
        <form onSubmit={handleUpload}>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setUploadFile(e.target.files[0])}
          />
          <button className="btn btn-primary ms-3">Upload</button>
        </form>

        {uploadResult && (
          <div className="mt-3">
            <strong>Uploaded Summary:</strong>
            <pre>{JSON.stringify(uploadResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-3 mb-4">
        <h5>Filters</h5>
        <div className="row">
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Filter by Trade"
              value={tradeFilter}
              onChange={(e) => setTradeFilter(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Filter by Category"
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Filter by Client"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Search Description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setTradeFilter("");
                setCatFilter("");
                setSearch("");
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <button className="btn btn-success mb-3" onClick={openAddModal}>
        Add New Rate
      </button>

      {/* Table */}
      <div className="card p-3">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Trade</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Sub Type</th>
                  <th>Brand</th>
                  <th>Description</th>
                  <th>Unit</th>
                  <th>Copper Price</th>
                  <th>Price (RM)</th>
                  <th>Client</th>
                  <th>Extra</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rates.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center">
                      No data
                    </td>
                  </tr>
                ) : (
                  rates.map((row) => (
                    <tr key={row.id}>
                      <td>{row.trade}</td>
                      <td>{row.category_item}</td>
                      <td>{row.equipment_type}</td>
                      <td>{row.sub_type}</td>
                      <td>{row.brand}</td>
                      <td>{row.description}</td>
                      <td>{row.unit}</td>
                      <td>{row.copper_pipe_price}</td>
                      <td>{row.price_rm}</td>
                      <td>{row.client}</td>
                      <td>{row.extra_col}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => openEditModal(row)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(row.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="d-flex justify-content-center mt-3">
  <nav>
    <ul className="pagination">

      {/* First Page */}
      <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
        <button className="page-link" onClick={() => setPage(1)}>
          &laquo;
        </button>
      </li>

      {/* Previous */}
      <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
        <button className="page-link" onClick={() => setPage(page - 1)}>
          &lsaquo;
        </button>
      </li>

      {/* Page Numbers */}
      {(() => {
        const totalPages = Math.ceil(total / limit) || 1;
        const pages = [];
        const maxButtons = 5;   // how many numbers to show around current page

        let start = Math.max(1, page - 2);
        let end = Math.min(totalPages, page + 2);

        if (start > 1) {
          pages.push(
            <li key="start-ellipsis" className="page-item disabled">
              <span className="page-link">...</span>
            </li>
          );
        }

        for (let i = start; i <= end; i++) {
          pages.push(
            <li key={i} className={`page-item ${i === page ? "active" : ""}`}>
              <button className="page-link" onClick={() => setPage(i)}>
                {i}
              </button>
            </li>
          );
        }

        if (end < totalPages) {
          pages.push(
            <li key="end-ellipsis" className="page-item disabled">
              <span className="page-link">...</span>
            </li>
          );
        }

        return pages;
      })()}

      {/* Next */}
      <li className={`page-item ${page >= Math.ceil(total / limit) ? "disabled" : ""}`}>
        <button className="page-link" onClick={() => setPage(page + 1)}>
          &rsaquo;
        </button>
      </li>

      {/* Last Page */}
      <li className={`page-item ${page >= Math.ceil(total / limit) ? "disabled" : ""}`}>
        <button className="page-link" onClick={() => setPage(Math.ceil(total / limit))}>
          &raquo;
        </button>
      </li>

    </ul>
  </nav>
</div>

          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
          <div
            className="modal fade show"
            style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">

                {/* Modal Header */}
                <div className="modal-header">
                  <h5 className="modal-title">
                    {isEditing ? "Edit Rate" : "Add New Rate"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                {/* Modal Body */}
                <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                  {Object.keys(form).map((key) =>
                    key === "source_row_number" ? null : (
                      <div className="mb-3" key={key}>
                        <label className="form-label fw-semibold">
                          {key.replace(/_/g, " ").toUpperCase()}
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors[key] ? "is-invalid" : ""}`}
                          value={form[key] || ""}
                          onChange={(e) => {
                            setForm({ ...form, [key]: e.target.value });

                            // Remove error as soon as user types
                            if (errors[key]) {
                              setErrors({ ...errors, [key]: null });
                            }
                          }}
                        />

                        {errors[key] && (
                          <div className="invalid-feedback">{errors[key]}</div>
                        )}

                      </div>
                    )
                  )}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                  <button
                    className="btn btn-success"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {setShowModal(false); setErrors({});}}
                  >
                    Close
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
    </div>
  );
}
