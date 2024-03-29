import flask

from database import Database
from api import ApiServer, SocketServer


class Server:
    def __init__(self) -> None:
        self.database = Database()
        self.app = flask.Flask(__name__)
        ApiServer(self.app, self.database)  # Adds the API routes to the Flask app
        self.socket_server = SocketServer(self.app, self.database)

    def run(self, debug=False):
        self.socket_server.start(debug=debug)


def main():
    server = Server()
    server.run(debug=True)


if __name__ == "__main__":
    main()
