import http.server
import ssl
import threading

from const import SERVER


class HTTPRequestHandler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        self.path_to_methods = {"/login": self.do_path_LOGIN}
        super().__init__(*args, directory=SERVER.SERVE_PATH, **kwargs)

    def do_GET(self):
        if self.path == "/":
            self.path = "index"

        # Check if it's a just the page name without the extension. eg. /login
        if "." not in self.path:
            # Add the extension
            self.path += ".html"

        # Serve the file
        return super().do_GET()

    def do_POST(self):
        # Check if the procedure for the path exists
        if self.path in self.path_to_methods:
            # Call the procedure
            self.path_to_methods[self.path]()
        else:
            # Return 404
            self.send_response(404)
            self.end_headers()

    def do_path_LOGIN(self):
        content_length = int(self.headers["Content-Length"])
        body = self.rfile.read(content_length).decode()
        # Split the body into the username and password
        email, password = body.split("&")
        email = email.split("=")[1]
        password = password.split("=")[1]
        # Check if the user exists
        ...

class HTTPSServer(threading.Thread):
    """
    A class that handles the HTTPS server. It runs on a separate thread.
    It takes care of serving the static files of the website, and handling requests.
    The procedure for handling requests is defined in the HTTPRequestHandler class.
    """

    def __init__(self):
        super().__init__(daemon=True)

    def run(self):
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(SERVER.CERT_PATH, SERVER.KEY_PATH)

        with http.server.HTTPServer((SERVER.IP, SERVER.PORT),
                                    HTTPRequestHandler) as httpd:
            httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
            print(
                f"Server running at https://{httpd.server_address[0]}:{httpd.server_address[1]}"
            )
            httpd.serve_forever()
