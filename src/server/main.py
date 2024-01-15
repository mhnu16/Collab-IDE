from http_handler import HTTPServer
from database import Database


class Server:

    def __init__(self) -> None:
        self.database = Database()
        self.HTTPServer = HTTPServer()


def main():
    ...


if __name__ == "__main__":
    main()
