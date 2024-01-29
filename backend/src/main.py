from web_server import WebServer
from database import Database


class Server:
    def __init__(self) -> None:
        self.database = Database()
        self.webserver = WebServer(self.database)

    def run(self):
        self.webserver.serve()


def main():
    server = Server()
    server.run()

if __name__ == "__main__":
    main()
