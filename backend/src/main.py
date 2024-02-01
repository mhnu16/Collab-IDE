from backend.src.api_server import ApiServer
from database import Database


class Server:
    def __init__(self) -> None:
        self.database = Database()
        self.api = ApiServer(self.database)

    def run(self):
        self.api.serve()


def main():
    server = Server()
    server.run()

if __name__ == "__main__":
    main()
