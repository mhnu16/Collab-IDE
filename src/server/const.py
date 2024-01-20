import os


class SERVER:
    SERVE_PATH: str = os.path.join(os.path.dirname(__file__), "..", "public")
    IP = "127.0.0.1"
    PORT = 5000
    CERT_PATH = os.path.join(os.path.dirname(__file__), "security", "cert.pem")
    KEY_PATH = os.path.join(os.path.dirname(__file__), "security", "key.pem")

    @staticmethod
    def get_ssl_password():
        with open(
            os.path.join(os.path.dirname(__file__), "security", ".key"), "r"
        ) as file:
            return file.read()


class DATABASE:
    DB_PATH = os.path.join(os.path.dirname(__file__), "database", "database.db")
