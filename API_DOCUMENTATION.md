# Staff Attendance System — API Documentation

## 1. Overview

This backend is built with Python, Flask, and SQLite. It provides JSON APIs for staff registration, attendance clock-in/clock-out, attendance records, and reports.

**Base URL (local development):**
`http://127.0.0.1:5000`

All endpoints below use this base URL.

## 2. API Endpoints

### A. Get All Staff

- **Method:** `GET`
- **Endpoint:** `/api/staff`
- **Full URL:** `http://127.0.0.1:5000/api/staff`

Returns a list of registered staff.

**Example response:**

```json
[
  {
    "staff_id": "SBC004",
    "full_name": "JAY",
    "department": "IT"
  }
]
```

### B. Register Staff

- **Method:** `POST`
- **Endpoint:** `/api/staff`
- **Full URL:** `http://127.0.0.1:5000/api/staff`
- **Content-Type:** `application/json`

**Request body:**

```json
{
  "staff_id": "SBC009",
  "full_name": "Jane Doe",
  "department": "HR"
}
```

**Example success response:**

```json
{
  "message": "Staff registered successfully.",
  "staff_id": "SBC009"
}
```

### C. Record Attendance

- **Method:** `POST`
- **Endpoint:** `/api/attendance`
- **Content-Type:** `application/json`

**Clock-in request:**

```json
{
  "staff_id": "SBC009",
  "action": "clock_in"
}
```

**Clock-out request:**

```json
{
  "staff_id": "SBC009",
  "action": "clock_out"
}
```

**Example success response:**

```json
{
  "message": "Attendance recorded successfully.",
  "staff_id": "SBC009",
  "action": "clock_in"
}
```

The backend validates the staff ID and attendance action. It also prevents duplicate clock-ins and clock-outs without a preceding clock-in.

### D. Get All Attendance Records

- **Method:** `GET`
- **Endpoint:** `/api/records`

Returns attendance records, including staff details, attendance action, record ID, and timestamp.

**Example response:**

```json
[
  {
    "id": 11,
    "staff_id": "SBC004",
    "full_name": "JAY",
    "department": "IT",
    "action": "clock_in",
    "timestamp": "2026-10-19 09:52:28"
  }
]
```

### E. Get Individual Staff Records

- **Method:** `GET`
- **Endpoint:** `/api/staff/<staff_id>/records`

Replace `<staff_id>` with the actual staff ID.

**Example URL:**

`http://127.0.0.1:5000/api/staff/SBC004/records`

Returns staff details, their attendance records, and clock-in/clock-out totals.

**Example response:**

```json
{
  "staff": {
    "staff_id": "SBC004",
    "full_name": "JAY",
    "department": "IT"
  },
  "records": [
    {
      "id": 11,
      "action": "clock_in",
      "timestamp": "2026-10-19 09:52:28"
    }
  ],
  "total_clock_ins": 1,
  "total_clock_outs": 0
}
```

### F. Get Today's Attendance Report

- **Method:** `GET`
- **Endpoint:** `/api/daily-report`

Returns today's attendance records, including staff names, departments, actions, and timestamps.

**Example response:**

```json
[
  {
    "staff_id": "SBC004",
    "full_name": "JAY",
    "department": "IT",
    "action": "clock_in",
    "timestamp": "2026-10-19 09:52:28"
  }
]
```

## 3. Frontend Integration

The frontend should:

1. Send `GET` requests to retrieve staff and attendance data.
2. Send `POST` requests with JSON bodies to register staff and record attendance.
3. Display the JSON response messages to users.
4. Handle errors returned by the backend, such as invalid staff IDs or invalid attendance actions.

For local development, the frontend can use `http://127.0.0.1:5000` as the API base URL when running on the same computer.

**Important:** If the frontend runs on a different device or is deployed online, this local URL will not work. The backend must be hosted at a reachable address, and cross-origin access (CORS) may need to be configured.

## 4. Running the Backend

From the project folder, activate the virtual environment if necessary, then run:

```bash
python app.py
```

The local backend should be available at:

`http://127.0.0.1:5000`

## 5. Current Limitations

- The API has not yet been configured for production deployment.
- Authentication and authorization have not been added.
- The local development server is not intended for production use.

## 6. Error Responses and Status Codes

| Status code | Meaning | Example |
|---|---|---|
| `201` | Resource created successfully | Staff registered or attendance recorded |
| `400` | Invalid or missing request data | Missing staff ID or invalid attendance action |
| `404` | Resource not found | Unregistered staff ID or staff member not found |
| `409` | Conflict with existing state | Duplicate Staff ID, already clocked in, or attempting to clock out before clocking in |

Error responses use JSON, for example:

```json
{
  "error": "Staff ID not registered."
}
```

The frontend should check the HTTP status code and display the `error` or `message` field as appropriate.

