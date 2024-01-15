import http.server
import ssl

from const import SERVER



class MyHandler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SERVER.SERVE_PATH, **kwargs)


    def do_GET(self):
        if self.path == "/":
            self.path = "index.html"

        # Serve the file
        return super().do_GET()


def run_server(port):
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(SERVER.CERT_PATH, SERVER.KEY_PATH)

    with http.server.HTTPServer((SERVER.IP, port), MyHandler) as httpd:
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
        print(f"Server running at https://{httpd.server_address[0]}:{httpd.server_address[1]}")
        httpd.serve_forever()


def main():
    run_server(8000)


if __name__ == "__main__":
    main()
