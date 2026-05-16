from flask import Flask, jsonify, render_template
import psutil
import os
import time

app = Flask(__name__)

# Store boot time once
BOOT_TIME = psutil.boot_time()

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/api/stats', methods=['GET'])
def get_stats():
    net     = psutil.net_io_counters()
    ram     = psutil.virtual_memory()
    battery = psutil.sensors_battery()
    uptime_seconds = int(time.time() - BOOT_TIME)

    # Uptime formatting
    hours   = uptime_seconds // 3600
    minutes = (uptime_seconds % 3600) // 60
    uptime_str = f"{hours}h {minutes}m"

    # Battery
    if battery:
        battery_info = {
            'percent': round(battery.percent, 1),
            'charging': battery.power_plugged
        }
    else:
        battery_info = None

    # GPU (try gputil, fallback to None)
    gpu_info = None
    try:
        import GPUtil
        gpus = GPUtil.getGPUs()
        if gpus:
            gpu_info = {
                'name': gpus[0].name,
                'load': round(gpus[0].load * 100, 1),
                'memory_percent': round(gpus[0].memoryUsed / gpus[0].memoryTotal * 100, 1)
            }
    except Exception:
        pass

    stats = {
        'cpu':      psutil.cpu_percent(interval=1),
        'ram':      ram.percent,
        'ram_used': round(ram.used / 1024 / 1024 / 1024, 1),
        'ram_total': round(ram.total / 1024 / 1024 / 1024, 1),
        'disk':     psutil.disk_usage('/').percent,
        'net_sent': round(net.bytes_sent / 1024 / 1024, 2),
        'net_recv': round(net.bytes_recv / 1024 / 1024, 2),
        'os':       'Windows' if os.name == 'nt' else os.uname().sysname,
        'hostname': os.environ.get('COMPUTERNAME', os.environ.get('HOSTNAME', 'Unknown')),
        'uptime':   uptime_str,
        'battery':  battery_info,
        'gpu':      gpu_info,
        'processes': [
            {'name': p.info['name'], 'cpu': p.info['cpu_percent']}
            for p in sorted(
                psutil.process_iter(['name', 'cpu_percent']),
                key=lambda p: p.info['cpu_percent'],
                reverse=True
            )
            if p.info['name'] != 'System Idle Process'
            and p.info['cpu_percent'] < 1000
        ][:5]
    }
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=True)