from api import ApiServer
from database import Database


class Server:
    def __init__(self) -> None:
        self.database = Database()
        self.api = ApiServer(self.database)

    def run(self, debug=True):
        self.api.serve(debug)


def main():
    server = Server()
    server.run(debug=True)


if __name__ == "__main__":
    main()
