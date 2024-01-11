import http.server
import socketserver

import const as con


class MyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=con.FILE_SERVE_PATH, **kwargs)

    def do_GET(self):
        if self.path == "/":
            self.path = "index.html"

        # Serve the file
        return super().do_GET()


def run_server(port):
    with socketserver.TCPServer(("", port), MyHandler) as httpd:
        print(f"Server running at http://localhost:{port}")
        httpd.serve_forever()


def main():
    run_server(8000)


if __name__ == "__main__":
    main()
