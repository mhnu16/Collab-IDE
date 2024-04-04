import os
import datetime


class SERVER:
    SERVE_PATH: str = os.path.join(
        os.path.dirname(__file__), "..", "..", "frontend", "build"
    )
    IP: str = "127.0.0.1"
    PORT: int = 5000
    COOKIE_MAX_AGE: datetime.timedelta = datetime.timedelta(weeks=1)

    @staticmethod
    def get_ssl_password() -> str:
        with open(
            os.path.join(os.path.dirname(__file__), "..", "certs", ".key"), "r"
        ) as file:
            return file.read()


class DATABASE:
    DB_PATH: str = os.path.join(
        os.path.dirname(__file__), "..", "database", "database.db"
    )
    PROJECTS_PATH: str = "projects"
    PATH_PREFIX: str = os.path.join(
        os.path.dirname(__file__), "..", "database"
    )
    SESSION_IDLE_TIMEOUT: datetime.timedelta = datetime.timedelta(weeks=1)