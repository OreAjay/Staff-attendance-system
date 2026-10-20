from flask import Flask, render_template, request, jsonify
import sqlite3
from database import create_table

app = Flask(__name__)

create_table()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/attendance", methods=["POST"])
def api_attendance():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "JSON data is required."}), 400

    staff_id = str(data.get("staff_id", "")).strip()
    action = data.get("action")

    if not staff_id:
        return jsonify({"error": "Staff ID is required."}), 400

    if action not in ("clock_in", "clock_out"):
        return jsonify({"error": "Invalid attendance action."}), 400

    connection = sqlite3.connect("attendance.db")
    cursor = connection.cursor()

    try:
        cursor.execute(
            "SELECT staff_id FROM staff WHERE staff_id = ?",
            (staff_id,)
        )

        if not cursor.fetchone():
            return jsonify({"error": "Staff ID not registered."}), 404

        cursor.execute(
            "SELECT action FROM attendance WHERE staff_id = ? ORDER BY id DESC LIMIT 1",
            (staff_id,)
        )
        last_record = cursor.fetchone()

        if action == "clock_in" and last_record and last_record[0] == "clock_in":
            return jsonify({"error": "Already clocked in."}), 409

        if action == "clock_out" and (
            not last_record or last_record[0] != "clock_in"
        ):
            return jsonify({"error": "You must clock in first."}), 409

        cursor.execute(
            "INSERT INTO attendance (staff_id, action) VALUES (?, ?)",
            (staff_id, action)
        )
        connection.commit()

        return jsonify({
            "message": "Attendance recorded successfully.",
            "staff_id": staff_id,
            "action": action
        }), 201

    finally:
        connection.close()

@app.route("/attendance", methods=["POST"])
def attendance():
    staff_id = request.form["staff_id"].strip()
    action = request.form["action"]

    if action not in ("clock_in", "clock_out"):
        return "Invalid attendance action."

    connection = sqlite3.connect("attendance.db")
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM staff WHERE staff_id = ?",
        (staff_id,)
    )

    staff = cursor.fetchone()

    if not staff:
        connection.close()
        return "Staff ID not registered. Please register first."

    cursor.execute(
        "SELECT action FROM attendance WHERE staff_id = ? ORDER BY id DESC LIMIT 1",
        (staff_id,)
    )
    last_record = cursor.fetchone()

    if action == "clock_in" and last_record and last_record[0] == "clock_in":
        connection.close()
        return "You are already clocked in."

    if action == "clock_out" and (not last_record or last_record[0] != "clock_in"):
        connection.close()
        return "You must clock in before you can clock out."

    cursor.execute(
        "INSERT INTO attendance (staff_id, action) VALUES (?, ?)",
        (staff_id, action)
    )

    connection.commit()
    connection.close()

    return f"Attendance recorded for {staff_id}: {action}"

@app.route("/api/staff", methods=["POST"])
def api_register_staff():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "JSON data is required."}), 400

    staff_id = str(data.get("staff_id", "")).strip()
    full_name = str(data.get("full_name", "")).strip()
    department = str(data.get("department", "")).strip()

    if not staff_id or not full_name or not department:
        return jsonify({"error": "All fields are required."}), 400

    connection = sqlite3.connect("attendance.db")
    cursor = connection.cursor()

    try:
        cursor.execute(
            "INSERT INTO staff (staff_id, full_name, department) VALUES (?, ?, ?)",
            (staff_id, full_name, department)
        )
        connection.commit()
        return jsonify({
            "message": "Staff registered successfully.",
            "staff_id": staff_id
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({"error": "This Staff ID is already registered."}), 409

    finally:
        connection.close()

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        staff_id = request.form["staff_id"].strip()
        full_name = request.form["full_name"].strip()
        department = request.form["department"].strip()

        if not staff_id or not full_name or not department:
            return "All fields are required."

        connection = sqlite3.connect("attendance.db")
        cursor = connection.cursor()

    
        try:
            cursor.execute(
                "INSERT INTO staff (staff_id, full_name, department) VALUES (?, ?, ?)",
                (staff_id, full_name, department)
            )
            connection.commit()
            message = f"Staff member {full_name} registered successfully."
        except sqlite3.IntegrityError:
            message = "This Staff ID is already registered."
        finally:
            connection.close()

        return message

    return render_template("register.html")

@app.route("/api/records", methods=["GET"])
def api_get_records():
    connection = sqlite3.connect("attendance.db")
    cursor = connection.cursor()

    cursor.execute("""
        SELECT attendance.id, attendance.staff_id, staff.full_name,
               staff.department, attendance.action, attendance.timestamp
        FROM attendance
        LEFT JOIN staff ON attendance.staff_id = staff.staff_id
        ORDER BY attendance.timestamp DESC
    """)

    rows = cursor.fetchall()
    connection.close()

    return jsonify([
        {
            "id": row[0],
            "staff_id": row[1],
            "full_name": row[2],
            "department": row[3],
            "action": row[4],
            "timestamp": row[5]
        }
        for row in rows
    ])

@app.route("/records")
def records():
    connection = sqlite3.connect("attendance.db")
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM attendance ORDER BY timestamp DESC")
    records = cursor.fetchall()

    connection.close()

    return render_template("attendance.html", records=records)

@app.route("/api/staff", methods=["GET"])
def api_get_staff():
    connection = sqlite3.connect("attendance.db")
    cursor = connection.cursor()

    cursor.execute(
        "SELECT staff_id, full_name, department FROM staff ORDER BY full_name"
    )
    staff = cursor.fetchall()
    connection.close()

    return jsonify([
        {
            "staff_id": member[0],
            "full_name": member[1],
            "department": member[2]
        }
        for member in staff
    ])

@app.route("/staff")
def staff_list():
    connection = sqlite3.connect("attendance.db")
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM staff ORDER BY full_name")
    staff = cursor.fetchall()

    connection.close()

    return render_template("staff.html", staff=staff)

@app.route("/api/staff/<staff_id>/records", methods=["GET"])
def api_staff_records(staff_id):
    connection = sqlite3.connect("attendance.db")
    cursor = connection.cursor()

    cursor.execute(
        "SELECT staff_id, full_name, department FROM staff WHERE staff_id = ?",
        (staff_id,)
    )
    staff = cursor.fetchone()

    if not staff:
        connection.close()
        return jsonify({"error": "Staff member not found."}), 404

    cursor.execute("""
        SELECT id, action, timestamp
        FROM attendance
        WHERE staff_id = ?
        ORDER BY timestamp DESC
    """, (staff_id,))

    rows = cursor.fetchall()
    connection.close()

    return jsonify({
        "staff": {
            "staff_id": staff[0],
            "full_name": staff[1],
            "department": staff[2]
        },
        "records": [
            {
                "id": row[0],
                "action": row[1],
                "timestamp": row[2]
            }
            for row in rows
        ],
        "total_clock_ins": sum(1 for row in rows if row[1] == "clock_in"),
        "total_clock_outs": sum(1 for row in rows if row[1] == "clock_out")
    })

@app.route("/staff/<staff_id>/records")
def staff_records(staff_id):
    connection = sqlite3.connect("attendance.db")
    cursor = connection.cursor()

    cursor.execute(
        "SELECT full_name FROM staff WHERE staff_id = ?",
        (staff_id,)
    )
    staff = cursor.fetchone()

    if not staff:
        connection.close()
        return "Staff member not found."

    cursor.execute(
        "SELECT * FROM attendance WHERE staff_id = ? ORDER BY timestamp DESC",
        (staff_id,)
    )
    records = cursor.fetchall()

    cursor.execute(
        "SELECT action, COUNT(*) FROM attendance WHERE staff_id = ? GROUP BY action",
        (staff_id,)
    )
    summary = dict(cursor.fetchall())

    total_clock_ins = summary.get("clock_in", 0)
    total_clock_outs = summary.get("clock_out", 0)

    connection.close()

    return render_template(
        "attendance.html",
        records=records,
        staff=staff,
        total_clock_ins=total_clock_ins,
        total_clock_outs=total_clock_outs
    )

@app.route("/api/daily-report", methods=["GET"])
def api_daily_report():
    connection = sqlite3.connect("attendance.db")
    cursor = connection.cursor()

    cursor.execute("""
        SELECT staff.staff_id, staff.full_name, staff.department,
               attendance.action, attendance.timestamp
        FROM attendance
        JOIN staff ON attendance.staff_id = staff.staff_id
        WHERE DATE(attendance.timestamp) = DATE('now', 'localtime')
        ORDER BY attendance.timestamp DESC
    """)

    rows = cursor.fetchall()
    connection.close()

    return jsonify([
        {
            "staff_id": row[0],
            "full_name": row[1],
            "department": row[2],
            "action": row[3],
            "timestamp": row[4]
        }
        for row in rows
    ])

@app.route("/daily-report")
def daily_report():
    connection = sqlite3.connect("attendance.db")
    cursor = connection.cursor()

    cursor.execute("""
        SELECT staff.staff_id, staff.full_name, staff.department,
               attendance.action, attendance.timestamp
        FROM attendance
        JOIN staff ON attendance.staff_id = staff.staff_id
        WHERE DATE(attendance.timestamp) = DATE('now', 'localtime')
        ORDER BY attendance.timestamp DESC
    """)

    records = cursor.fetchall()
    connection.close()

    return render_template("daily_report.html", records=records)


if __name__ == "__main__":
    app.run(debug=True)