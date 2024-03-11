import datetime
import os
from hashlib import sha256

from const import DATABASE

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    create_engine,
    select,
    update,
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker, relationship

from typing import Type, TypeVar, Any


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

    def to_dict(self) -> dict[str, Any]:
        """
        Returns the user as a dictionary.
        """
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
        }


class Session(Base):
    """
    A class that represents a session in the database.
    It's used for authenticating users upon attempted access to the website.
    """

    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, nullable=False)
    session_id = Column(String, nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_accessed_at = Column(
        DateTime, default=datetime.datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return f"<Session(session_id={self.session_id}, user_id={self.user_id}, created_at={self.created_at}, last_accessed_at={self.last_accessed_at})>"

    def to_dict(self) -> dict[str, Any]:
        """
        Returns the session as a dictionary.
        """
        return {
            "id": self.id,
            "session_id": self.session_id,
            "user_id": self.user_id,
            "created_at": self.created_at,
            "last_accessed_at": self.last_accessed_at,
        }


class Project(Base):
    """
    A class that represents a project in the database.
    It's used for storing project information.
    """

    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, nullable=False)
    project_id = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    language = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    directory = Column(
        String, nullable=False
    )  # The directory where the project's files are stored

    allowed_users = relationship(
        "User", secondary="allowed_users", back_populates="projects"
    )

    def __repr__(self) -> str:
        return f"<Project(project_id={self.project_id}, name={self.name}, description={self.description}, language={self.language}, created_at={self.created_at})>"

    def to_dict(self) -> dict[str, Any]:
        """
        Returns the project as a dictionary.
        """
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "language": self.language,
            "created_at": self.created_at,
            "allowed_users": self.get_allowed_users(),
            "structure": self.get_structure(),
        }

    def get_structure(self, path=directory) -> dict[str, Any]:
        """
        Returns the structure of the project's filesystem as a dictionary.
        """
        structure = {}
        directory = str(path)
        for item in os.listdir(directory):
            item_path = os.path.join(directory, item)
            if os.path.isdir(item_path):
                structure[item] = self.get_structure(item_path)
            else:
                structure[item] = None

        return structure

    def get_allowed_users(self) -> list[dict[str, Any]]:
        """
        Returns the allowed users of the project as a list of dictionaries.
        """
        return [user.to_dict() for user in self.allowed_users]


class AllowedUsers(Base):
    """
    A class that represents the allowed users of a project in the database.
    It's used for storing the allowed users of a project.
    """

    __tablename__ = "allowed_users"

    id = Column(Integer, primary_key=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    def __repr__(self) -> str:
        return f"<AllowedUsers(project_id={self.project_id}, user_id={self.user_id})>"


tables = TypeVar("tables", User, Session, Project, AllowedUsers)


class Database:
    """
    A class that represents a database.
    It acts as an interface between the server and the database.
    """

    def __init__(self) -> None:
        self.engine = create_engine("sqlite:///" + DATABASE.DB_PATH, echo=False)
        Base.metadata.create_all(self.engine)

    def add_user(self, username: str, email: str, password: str) -> int:
        """
        Adds a user to the database.

        Note:
        The password is hashed inside this method.

        Args:
            username: The username of the user.
            email: The email of the user.
            password: The password of the user.

        Returns:
            The id of the user if the user was added successfully, -1 otherwise.
        """
        with self.__open_session() as db_session:
            password = self.hash_sha256(password)
            user = User(username=username, email=email, password=password)
            db_session.add(user)

        user = self.select_from(User, User.username == username)
        if user is None:
            return -1
        return user.id

    def add_session(self, user_id: int) -> str:
        """
        Adds a session to the database.

        Args:
            user_id: The id of the user to create a session for.

        Returns:
            The session id.
        """
        with self.__open_session() as db_session:
            session_id = self.__generate_session_id()
            session = Session(session_id=session_id, user_id=user_id)
            db_session.add(session)
            return session_id

    def add_project(
        self,
        project_id: str,
        name: str,
        description: str,
        language: str,
        user_id: str,
    ) -> int:
        """
        Adds a project to the database.
        Automatically adds the user to the allowed users of the project.
        Creates a directory for the project based on the project_id.

        Args:
            project_id: The id of the project.
            name: The name of the project.
            description: The description of the project.
            language: The language of the project.
            user_id: The id of the user who created the project.

        Returns:
            The id of the project if the project was added successfully, -1 otherwise.
        """
        with self.__open_session() as db_session:
            directory = os.path.join(DATABASE.PROJECTS_PATH, project_id)
            os.makedirs(directory, exist_ok=True)

            project = Project(
                project_id=project_id,
                name=name,
                description=description,
                language=language,
                directory=directory,
            )
            db_session.add(project)

            allowed_user = AllowedUsers(project_id=project.id, user_id=user_id)
            db_session.add(allowed_user)

        project = self.select_from(Project, Project.project_id == project_id)
        if project is None:
            # If the project was not added successfully, delete the directory
            os.rmdir(directory)
            return -1

        return project.id

    def add_allowed_user(self, project_id: int, user_id: int) -> None:
        """
        Adds a user to the allowed users of a project.

        Args:
            project_id: The id of the project.
            user_id: The id of the user.
        """
        with self.__open_session() as db_session:
            allowed_user = AllowedUsers(project_id=project_id, user_id=user_id)
            db_session.add(allowed_user)

    def validate_session(self, session_id: str) -> bool:
        """
        Validates a session.
        Updates the session's last_accessed_at field if the session is valid.
        Otherwise, deletes the session from the database.

        Args:
            session_id: The session id to validate.

        Returns:
            True if the session is valid, False otherwise.
        """
        # Get the session from the database
        session = self.select_from(Session, Session.session_id == session_id)

        if session is None:
            return False

        # Check if the session is expired
        if (
            datetime.datetime.now() - session.last_accessed_at
            > DATABASE.SESSION_IDLE_TIMEOUT
        ):
            # If the session is expired, delete it from the database
            self.delete_from(Session, Session.session_id == session_id)
            return False

        # Update the session's last_accessed_at field
        self.__update_session(session_id)
        return True

    def __update_session(self, session_id: str) -> None:
        """
        Updates a session's last_accessed_at field.
        """
        with self.__open_session() as db_session:
            statement = (
                update(Session)
                .filter_by(session_id=session_id)
                .values(last_accessed_at=datetime.datetime.now())
            )
            db_session.execute(statement)

    def delete_from(self, table: Type[tables], *filters) -> None:
        """
        Deletes a row from the database.

        Internally, it calls the `self.select_from` method to get the row to delete.

        Args:
            table: The table to delete from.
            *filters: The filters to apply to the WHERE clause.
        """
        with self.__open_session() as db_session:
            user = self.select_from(table, *filters)
            db_session.delete(user)

    def select_from(self, table: Type[tables], *filters) -> tables | None:
        """
        Gets the first column and row that matches the filters.

        e.g.::

            class User(Base):
                ...
            class Session(Base):
                ...
            # Returns the user with the username "test"
            user = database.select_from(User, User.username == "test")
            # Returns the session with the session_id "aBcD"
            session = database.select_from(Session, Session.session_id == "aBcD")
            # Returns the user with the username "test" and the email "test@gmail"
            user = database.select_from(User, User.username == "test", User.email == "test@gmail")

        Note:
            It is possible to provide more complex filters via the SQLAlchemy library `and_` and `or_` functions.
            For example, to get the user with the username "test" or the email "test@gmail", you can do::

                from sqlalchemy import or_

                user = database.select_from(User, or_(User.username == "test", User.email == "test@gmail"))

        Args:
            table: The table to select from.
            *filters: The filters to apply to the WHERE clause.

        Returns:
            The found row if it exists, None otherwise.

        """
        with self.__open_session() as db_session:
            statement = select(table).where(*filters)
            return db_session.execute(statement).scalar()

    def __open_session(self):
        """
        Gets a session from the database.
        """
        # expire_on_commit=False prevents the session from being closed after a commit
        # This makes it so when we try and access the data we got from the session, we don't try and access a closed session
        Session = sessionmaker(bind=self.engine, expire_on_commit=False)
        return Session.begin()

    @staticmethod
    def __generate_session_id() -> str:
        """
        Generates a session id.

        Returns:
            A session id - a hexadecimal string.
        """
        return os.urandom(16).hex()

    @staticmethod
    def hash_sha256(password: str) -> str:
        """
        Hashes the password.

        Args:
            password - string: The password to hash.

        Returns:
            The hashed password - a hexadecimal string.
        """
        return sha256(password.encode()).hexdigest()
