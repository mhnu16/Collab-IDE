from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from hashlib import sha256

from const import DATABASE


class Base(DeclarativeBase):
    pass


class User(Base):
    """
    A class that represents a user in the database.
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, nullable=False)
    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)

    def __repr__(self) -> str:
        return f"<User(username={self.username}, email={self.email})>"


class Database:
    """
    A class that represents a database.
    It acts as an interface between the server and the database.
    """

    def __init__(self) -> None:
        self.engine = create_engine("sqlite:///" + DATABASE.DB_PATH, echo=True)
        Base.metadata.create_all(self.engine)

    def add_user(self, username, email, password) -> None:
        """
        Adds a user to the database.
        """
        with self.__get_session() as session:
            password = self.hash(password)
            user = User(username=username, email=email, password=password)
            session.add(user)

    def get_user_by_name(self, username) -> User | None:
        """
        Gets a user from the database by username.
        """
        with self.__get_session() as session:
            return session.query(User).filter_by(username=username).first()

    def get_user_by_email(self, email) -> User | None:
        """
        Gets a user from the database by email.
        """
        with self.__get_session() as session:
            return session.query(User).filter_by(email=email).first()

    def __get_session(self):
        """
        Gets a session from the database.
        """
        Session = sessionmaker(bind=self.engine)
        return Session.begin()

    def hash(self, password):
        """
        Hashes the password.
        """
        return sha256(password.encode()).hexdigest()
