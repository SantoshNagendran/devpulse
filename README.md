#  DevPulse Real Time System Monitor

A real time system health monitoring dashboard built with **Python Flask** and **Vanilla JavaScript**.
Monitor your CPU, RAM, Disk, Battery, Network and running processes all live in your browser.

![Python](https://img.shields.io/badge/Python-3.x-blue)
![Flask](https://img.shields.io/badge/Flask-Backend-black)
![JavaScript](https://img.shields.io/badge/JavaScript-Frontend-yellow)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **Live CPU, RAM & Disk** usage with colour coded progress bars
- **Battery** level and charging status
- **Network** sent & received (total since boot)
- **Top 5 processes** by CPU usage
- **CPU & RAM history graphs** last 60 seconds
- **Live clock** updating every second
- **Browser notifications** when CPU exceeds 80%
- **Export session stats** as CSV
- **Dark / Light mode** toggle
- **Pulsing live indicator**

---

## Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Backend   | Python, Flask, psutil   |
| Frontend  | HTML, CSS, JavaScript   |
| Charts    | Canvas API (no library) |

---

## Setup & Run

### 1. Clone the repo
```bash
git clone https://github.com/SantoshNagendran/devpulse.git
cd devpulse
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the app
```bash
python app.py
```

### 4. Open in browser
```
http://127.0.0.1:5000
```

---

## Project Structure

```
devpulse/
├── app.py              # Flask backend + psutil API
├── requirements.txt    # Python dependencies
├── templates/
│   └── index.html      # Dashboard UI
└── static/
    ├── dashboard.js    # Live updates + charts
    └── style.css       # Dark/light theme styling
```

---

## Author

**Santosh N** — CSE Diploma Student, TNGPTC Madurai-11
[LinkedIn](https://www.linkedin.com/in/santosh-nagendran) • [GitHub](https://github.com/SantoshNagendran)

---

## License

MIT License free to use and modify!
