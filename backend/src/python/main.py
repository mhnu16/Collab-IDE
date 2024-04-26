import sys
import flask

from database import Database
from api import ApiServer


class Server:
    def __init__(self) -> None:
        self.database = Database.get_instance()
        self.app = flask.Flask(__name__)
        ApiServer(self.app)  # Adds the API routes to the Flask app

    def run(self, debug=False):
        self.app.run(
            host="localhost",
            port=5000,
            debug=debug,
        )


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--dev":
        print("Starting in development mode")
        server = Server()
        server.run(debug=True)
    else:
        print("Starting in production mode")
        server = Server()
        server.run(debug=False)


if __name__ == "__main__":
    main()
