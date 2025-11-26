import React, { useState } from "react";
import "./css/searchworkorders.css";

const SearchWorkOrder = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [workorder, setWorkorder] = useState(null);
  const [childWorkorders, setChildWorkorders] = useState([]);
   const [closingImages, setClosingImages] = useState([]);

  const [error, setError] = useState("");

  // 🔍 Search Workorder
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setWorkorder(null);
      setChildWorkorders([]);
      setError("");
      return;
    }

    try {
      console.log("Searching for:", searchTerm);
      const res = await fetch(
        `http://localhost:5000/api/workorders/search?query=${searchTerm}`
      );
      if (!res.ok) throw new Error("Workorder not found");

      const data = await res.json();
      console.log("Search result:", data);

      const openWorkorder = data.find((wo) => wo.STATUS === "OPEN") || data[0];
      if (!openWorkorder) {
        setError("Workorder not found.");
        return;
      }

      setWorkorder(openWorkorder);
      setError("");

      if (!openWorkorder.parent_workorder) {
        fetchChildWorkorders(openWorkorder.WORKORDER);
      } else {
        setChildWorkorders([]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // 👶 Fetch child workorders
  const fetchChildWorkorders = async (parentWO) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/workorders/childs/${parentWO}`
      );
      if (res.ok) {
        const data = await res.json();
        console.log("Fetched child workorders:", data);
        setChildWorkorders(
          data.filter((c) => c.STATUS === "OPEN" || c.STATUS === "CLOSED")
        );
      } else {
        setChildWorkorders([]);
      }
    } catch (err) {
      console.error("Error fetching child workorders:", err);
      setChildWorkorders([]);
    }
  };

const handleCloseParent = async () => {
  if (!workorder) {
    alert("No workorder selected!");
    return;
  }

  if (childWorkorders.some((c) => c.STATUS === "OPEN")) {
    alert("❌ Cannot close parent while child workorders are still open.");
    return;
  }

  // if (!closingImage) {
  //   alert("Please upload a closing image before closing the workorder.");
  //   return;
  // }
  if (closingImages.length === 0) {
  alert("Please upload at least one closing image before closing the workorder.");
  return;
}


  const workorderId =
    workorder.ID || workorder.id || workorder._id || workorder.WORKORDER;

  try {
    const formData = new FormData();
formData.append("STATUS", "CLOSED");
closingImages.forEach((file) => {
  formData.append("closing_images[]", file);
});


    const res = await fetch(
      `http://localhost:5000/api/workorders/${workorderId}`,
      {
        method: "PUT",
        body: formData,
      }
    );

    const result = await res.json();
    if (!res.ok)
      throw new Error(result.message || "Failed to close workorder");

    alert("✅ Parent workorder closed successfully!");
    setWorkorder((prev) => ({ ...prev, STATUS: "CLOSED" }));
    if (workorder.WORKORDER) fetchChildWorkorders(workorder.WORKORDER);
    // setClosingImage(null); // reset image
    setClosingImages([]);

  } catch (err) {
    console.error("Error closing workorder:", err);
    alert(`❌ ${err.message}`);
  }
};


  return (
    <div className="workorders-container">
      <h2 className="page-title">Search WorkOrder</h2>

      {/* 🔍 Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter WorkOrder..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* 📄 Workorder Details */}
      {workorder && (
        <div className="section-card">
          <div className="section-header">Workorder Details</div>

          <div className="section-content">
            {/* Row 1 */}
            <div className="wo-row">
              <div className="wo-header-row">
                <div>WorkOrder</div>
                <div>Type</div>
                <div>Area</div>
              </div>
              <div className="wo-value-row">
                <div>{workorder.WORKORDER}</div>
                <div>{workorder.WORKORDER_TYPE}</div>
                <div>{workorder.WORKORDER_AREA}</div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="wo-row">
              <div className="wo-header-row">
                <div>Requested Time Closing</div>
                <div>Remarks</div>
                <div>Rate</div>
              </div>
              <div className="wo-value-row">
                <div>
                  {workorder.REQUESTED_TIME_CLOSING
                    ? new Date(
                        workorder.REQUESTED_TIME_CLOSING
                      ).toLocaleString()
                    : "N/A"}
                </div>
                <div>{workorder.REMARKS || "—"}</div>
                <div>{workorder.RATE?.total_rate ?? "N/A"}</div>
              </div>
            </div>

            {/* Row 3 */}
            <div className="wo-row">
              <div className="wo-header-row">
                <div>Created At</div>
                <div>Status</div>
                <div></div>
              </div>
              <div className="wo-value-row">
                <div>
                  {new Date(workorder.CREATED_T).toLocaleString() ?? "N/A"}
                </div>
                <div>{workorder.STATUS}</div>
                <div></div>
              </div>
            </div>

            {/* 🔵 Replace WorkOrder Actions with Sl No, WorkOrder, Contractor Name */}
          {/* Contractor Info */}
            <div className="section-card no-header">
              <div className="table-wrapper">
                <table className="child-table">
                  <thead>
                    <tr>
                      <th>Sl. No</th>
                      <th>WorkOrder</th>
                      <th>CONTRACTOR_NAME</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>{workorder.WORKORDER || "—"}</td>
                      <td>{workorder.contractor_name || "—"}</td>

                    </tr>
                  </tbody>
                </table>
              </div>
            </div>


{workorder.STATUS === "OPEN" && (
  <div className="close-section">
    <label>Upload Closing Image:</label>
<input
  type="file"
  accept="image/*"
  multiple
  onChange={(e) =>
    setClosingImages((prev) => [
      ...prev,
      ...Array.from(e.target.files),
    ])
  }
/>


{/* Preview selected images */}
{closingImages.length > 0 && (
  <div className="image-preview-list">
    {closingImages.map((file, idx) => (
      <div key={idx} className="image-preview-item">
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="preview-thumbnail"
        />
        <div className="file-info">
          <span className="file-name">{file.name}</span>
          <button
            type="button"
            className="remove-btn"
            onClick={() =>
              setClosingImages((prev) => prev.filter((_, i) => i !== idx))
            }
          >
            ❌
          </button>
        </div>
      </div>
    ))}
  </div>
)}

    <button className="close-btn" onClick={handleCloseParent}>
      Close Parent Workorder
    </button>
  </div>
)}

          </div>
        </div>
      )}

      {/* 👶 Child Workorders */}
      {childWorkorders.length > 0 && (
        <div className="section-card no-header">
          <div className="table-wrapper">
            <table className="child-table">
              <thead>
                <tr>
                  <th>WorkOrder</th>
                  <th>Type</th>
                  <th>Area</th>
                  <th>Requested Time Closing</th>
                  <th>Remarks</th>
                  <th>Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {childWorkorders.map((child, i) => (
                  <tr key={i}>
                    <td>{child.WORKORDER}</td>
                    <td>{child.WORKORDER_TYPE}</td>
                    <td>{child.WORKORDER_AREA}</td>
                    <td>
                      {child.REQUESTED_TIME_CLOSING
                        ? new Date(
                            child.REQUESTED_TIME_CLOSING
                          ).toLocaleString()
                        : "N/A"}
                    </td>
                    <td>{child.REMARKS || "—"}</td>
                    <td>{child.RATE?.total_rate ?? "N/A"}</td>
                    <td>{child.STATUS}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {workorder &&
        childWorkorders.length === 0 &&
        !workorder.parent_workorder && (
          <p className="no-child-msg">No child workorders mapped.</p>
        )}
    </div>
  );
};

export default SearchWorkOrder;