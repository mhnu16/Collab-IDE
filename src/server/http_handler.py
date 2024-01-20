import http.server
import ssl
import threading
from functools import partial

from const import SERVER


class HTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, database, *args, **kwargs):
        self.database = database
        # A dictionary that maps a path to a procedure
        self.path_to_methods = {
            "/login": self.do_path_LOGIN,
            "/register": self.do_path_REGISTER,
        }
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
        # When the user logs in, the frontend sends an AJAX request to this path.
        # The request contains the email and password in the body.
        body = self.parse_AJAX_request()

        email = body["email"]
        password = body["password"]

        user = self.database.get_user_by_email(email)
        if user is None:
            # If the user doesn't exist, return 404
            self.send_response(404)
            self.end_headers()
        else:
            # If the user exists, check if the password is correct by hashing it and comparing it to the hashed password in the database
            password = self.database.hash(password)
            if user.password == password:
                # If the password is correct, return 200
                self.send_response(200)
                self.end_headers()
            else:
                # If the password is incorrect, return 404
                self.send_response(404)
                self.end_headers()

    def do_path_REGISTER(self):
        # When the user registers, the frontend sends an AJAX request to this path.
        # The request contains the username, email and password in the body.
        body = self.parse_AJAX_request()

        username = body["username"]
        email = body["email"]
        password = body["password"]

        # Check if the password is valid
        result = self.is_valid_password(password)
        if not result[0]:
            # If the password is invalid, return 404 with a message
            self.send_response(404)
            self.end_headers()
            self.wfile.write(result[1].encode())
            return

        # Check if the username or email already exists in the database
        if (
            self.database.get_user_by_name(username) is not None
            or self.database.get_user_by_email(email) is not None
        ):
            # If the username or email already exists, return 404 with a message
            self.send_response(404)
            self.end_headers()
            self.wfile.write("Username or email already exists".encode())
        else:
            # If the username and email don't exist, add the user to the database
            self.database.add_user(username, email, password)
            # Return 200
            self.send_response(200)
            self.end_headers()

    def is_valid_password(self, password) -> tuple[bool, str]:
        """
        Checks if the password is valid, according to the following rules:
        - It must be at least 8 characters long

        """
        # Check if the password is at least 8 characters long
        if not len(password) >= 8:
            return False, "Password must be at least 8 characters long"
        # Checks if the password has at least one digit
        if not any(char.isdigit() for char in password):
            return False, "Password must contain at least one digit"
        # Checks if the password has at least one uppercase letter
        if not any(char.isupper() for char in password):
            return False, "Password must contain at least one uppercase letter"
        # Checks if the password has at least one lowercase letter
        if not any(char.islower() for char in password):
            return False, "Password must contain at least one lowercase letter"

        return True, ""

    def parse_AJAX_request(self):
        # This function parses the body of an AJAX request.
        # It returns a dictionary with the key value pairs of the body.
        content_length = int(self.headers["Content-Length"])
        body = self.rfile.read(content_length)
        body = body.decode()
        body = body.split("&")
        body = {key: value for key, value in [pair.split("=") for pair in body]}
        return body


class HTTPSServer(threading.Thread):
    """
    A class that handles the HTTPS server. It runs on a separate thread.
    It takes care of serving the static files of the website, and handling requests.
    The procedure for handling requests is defined in the HTTPRequestHandler class.
    """

    def __init__(self, database):
        super().__init__()
        self.database = database
        self.daemon = True

    def run(self):
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(SERVER.CERT_PATH, SERVER.KEY_PATH, SERVER.get_ssl_password())

        # This is done to pass the database to the HTTPRequestHandler class, so that it may interact with it.
        handler = partial(HTTPRequestHandler, self.database)
        with http.server.HTTPServer((SERVER.IP, SERVER.PORT), handler) as httpd:
            httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
            print(
                f"Server running at https://{httpd.server_address[0]}:{httpd.server_address[1]}"
            )
            httpd.serve_forever()
