import datetime
import os
from hashlib import sha256

from utils.const import DATABASE

from sqlalchemy import (
    Column,
    ColumnExpressionArgument,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    create_engine,
    select,
    update,
    delete,
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker, relationship, scoped_session

from typing import Type, TypeVar, Any

from contextlib import contextmanager


class Base(DeclarativeBase):
    pass


AllowedUsers = Table(
    "allowed_users",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("project_id", Integer, ForeignKey("projects.id")),
)


class Session(Base):
    """
    A class that represents a session in the database.
    It's used for authenticating users upon attempted access to the website.
    """

    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, nullable=False)
    session_id = Column(String, nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.now(), nullable=False)
    last_accessed_at = Column(DateTime, default=datetime.datetime.now(), nullable=False)

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


class User(Base):
    """
    A class that represents a user in the database.
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, nullable=False)
    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)

    projects = relationship(
        "Project",
        secondary="allowed_users",
        back_populates="allowed_users",
    )

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
    created_at = Column(DateTime, default=datetime.datetime.now(), nullable=False)
    directory = Column(
        String, nullable=False
    )  # The directory where the project's files are stored

    allowed_users = relationship(
        "User",
        secondary="allowed_users",
        back_populates="projects",
    )

    def __repr__(self) -> str:
        return f"<Project(project_id={self.project_id}, name={self.name}, description={self.description}, language={self.language}, created_at={self.created_at}, directory={self.directory})>"

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

    def get_structure(self, path: str | None = None) -> dict[str, Any]:
        """
        Returns the structure of the project's filesystem as a dictionary.
        """
        directory = str(path or self.directory)

        structure = {}

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


tables = TypeVar("tables", User, Session, Project)


class Database:
    """
    A class that represents a database.
    It's used for interacting with the database.
    When attempting to use this class, it's required to use the `with` statement, unless specified otherwise.
    """

    def __init__(self) -> None:
        self.engine = create_engine("sqlite:///" + DATABASE.DB_PATH, echo=False)
        Base.metadata.create_all(self.engine)
        self.Session = scoped_session(sessionmaker(bind=self.engine))

    @contextmanager
    def session_scope(self):
        """
        Provides a transactional scope around a series of operations.
        """
        session = self.Session()
        try:
            yield None
            session.commit()
        except:
            session.rollback()
            raise
        finally:
            session.close()
            self.Session.remove()

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
        self.__in_session()

        hashed_password = self.hash_sha256(password)
        user = User(username=username, email=email, password=hashed_password)
        self.Session.add(user)

        user = self.select_from(User, User.username == username)
        if user:
            return user.id
        return -1

    def add_session(self, user_id: int) -> str | None:
        """
        Adds a session to the database.

        Args:
            user_id: The id of the user.

        Returns:
            The session_id if the session was added successfully, None otherwise.
        """
        self.__in_session()

        session_id = self.generate_id()
        session = Session(session_id=session_id, user_id=user_id)
        self.Session.add(session)

        session = self.select_from(Session, Session.session_id == session_id)
        if session:
            return session.session_id
        return None

    def add_project(
        self, project_id: str, name: str, description: str, language: str, user_id: int
    ) -> int:

        self.__in_session()

        directory = os.path.join(DATABASE.PROJECTS_PATH, project_id)
        os.makedirs(directory, exist_ok=True)

        project = Project(
            project_id=project_id,
            name=name,
            description=description,
            language=language,
            directory=directory,
        )
        self.Session.add(project)

        project = self.select_from(Project, Project.project_id == project_id)
        if project:
            self.add_allowed_user(project.id, user_id)
            return project.id

        # If the project was not added successfully, delete the directory
        os.rmdir(directory)
        return -1

    def add_allowed_user(self, project_id: int, user_id: int) -> None:
        self.__in_session()

        project = self.select_from(Project, Project.id == project_id)
        user = self.select_from(User, User.id == user_id)
        if project and user:
            statement = AllowedUsers.insert().values(
                user_id=user_id, project_id=project_id
            )
            self.Session.execute(statement)

    def validate_session(self, session_id: str) -> bool:
        """
        Validates a session by checking if it exists AND if it hasn't expired.
        Updates the session's last_accessed_at field if the session is valid.
        Otherwise, deletes the session from the database.

        Args:
            session_id: The session id to validate.

        Returns:
            True if the session is valid, False otherwise.
        """
        self.__in_session()

        session = self.select_from(Session, Session.session_id == session_id)
        if session:
            last_accessed_at = session.last_accessed_at
            # The time passed since the session was last accessed is less than the session idle timeout
            if (
                datetime.datetime.now() - last_accessed_at
            ) < DATABASE.SESSION_IDLE_TIMEOUT:
                statement = (
                    update(Session)
                    .where(Session.session_id == session_id)
                    .values(last_accessed_at=datetime.datetime.now())
                )
                self.Session.execute(statement)

                return True

            self.delete_from(Session, Session.session_id == session_id)
        return False

    def select_from(
        self, table: Type[tables], *filters: ColumnExpressionArgument[bool]
    ) -> tables | None:
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
        self.__in_session()

        query = select(table).filter(*filters)
        result = self.Session.execute(query).scalar()
        return result

    def delete_from(
        self, table: Type[tables], *filters: ColumnExpressionArgument[bool]
    ) -> None:
        """
        Deletes a row from the database.

        Internally, it calls the `self.select_from` method to get the row to delete.

        Args:
            table: The table to delete from.
            *filters: The filters to apply to the WHERE clause.
        """
        self.__in_session()

        row = self.select_from(table, *filters)
        if row:
            self.Session.delete(row)

    def __in_session(self):
        if not self.Session:
            raise Exception("Not in session")
        elif self.Session.is_active:
            return True
        return False

    @staticmethod
    def generate_id() -> str:
        """
        Generates a random id.

        Note:
            Does not require a database session.

        Returns:
            A random id - a hexadecimal string.
        """
        return os.urandom(16).hex()

    @staticmethod
    def hash_sha256(password: str) -> str:
        """
        Hashes a password using the SHA-256 algorithm.

        Note:
            Does not require a database session.

        Args:
            password: The password to hash.

        Returns:
            The hashed password - a hexadecimal string.
        """
        return sha256(password.encode()).hexdigest()
