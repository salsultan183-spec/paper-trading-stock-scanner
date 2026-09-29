#!/usr/bin/env python3
"""
Simple HTTP server for TradeZero Paper Scanner
Runs on port 8000 and serves static files (HTML, CSS, JS)
"""
import http.server
import socketserver
import os

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(("0.0.0.0", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 TradeZero Paper Scanner running on http://localhost:{PORT}")
        print(f"📊 Paper trading only - No live orders")
        httpd.serve_forever()
