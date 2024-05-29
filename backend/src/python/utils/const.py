import os
import datetime


class DATABASE:
    DB_PATH: str = os.path.join(
        os.path.dirname(__file__), "..", "database", "database.db"
    )
    SESSION_IDLE_TIMEOUT: datetime.timedelta = datetime.timedelta(weeks=1)


class SERVER:
    IP: str = "127.0.0.1"
    PORT: int = 5000
    COOKIE_MAX_AGE: datetime.timedelta = DATABASE.SESSION_IDLE_TIMEOUT
