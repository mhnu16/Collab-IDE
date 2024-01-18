from http_handler import HTTPSServer
from database import Database


class Server:

    def __init__(self) -> None:
        self.database = Database()
        self.http_server = HTTPSServer(self.database)
        
    def run(self):
        self.http_server.start()


def main():
    server = Server()
    server.run()


if __name__ == "__main__":
    main()
