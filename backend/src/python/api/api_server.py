from typing import Any
import flask

from utils import SERVER

from database import Database, User, Session, Project

from random import random


class ApiServer:
    def __init__(self, app: flask.Flask):
        self.database = Database.get_instance()
        self.app = app

        @self.app.route("/api/rand")
        def rand():
            return self.json_response(True, {"num": random()})

        @self.app.route("/api/login", methods=["POST"])
        def login():
            data = flask.request.json
            if not data:
                return self.json_response(False, {"error": "Invalid request"}, 400)
            email = data.get("email")
            password = data.get("password")
            if email and password:
                password = self.database.hash_sha256(password)
                with self.database.session_scope():
                    user = self.database.select_from(
                        User, User.email == email, User.password == password
                    )
                    if user:
                        session = self.database.add_session(user.id)
                        # Set the session cookie
                        response = self.json_response(True, user.to_dict())
                        response.set_cookie(
                            "session_id",
                            session.session_id,
                            httponly=True,
                            secure=True,
                            samesite="Strict",
                            max_age=SERVER.COOKIE_MAX_AGE,
                        )
                        return response
                    else:
                        return self.json_response(
                            False, {"error": "Email or password is incorrect"}
                        )
            return self.json_response(False, {"error": "Failed to login"})

        @self.app.route("/api/logout", methods=["POST"])
        def logout():
            session_id = flask.request.cookies.get("session_id")
            if session_id:
                with self.database.session_scope():
                    self.database.delete_from(Session, Session.session_id == session_id)

            response = self.json_response(True, {})
            response.set_cookie(
                "session_id",
                "",
                expires=0,
                httponly=True,
                secure=True,
                samesite="Strict",
            )
            return response

        @self.app.route("/api/register", methods=["POST"])
        def register():
            data = flask.request.json
            if not data:
                return self.json_response(False, {"error": "Invalid request"}, 400)
            email = data.get("email")
            username = data.get("username")
            password = data.get("password")
            if email and username and password:
                with self.database.session_scope():
                    user = self.database.add_user(username, email, password)
                    if user:
                        session = self.database.add_session(user.id)
                        response = self.json_response(True, user.to_dict())
                        response.set_cookie(
                            "session_id",
                            session.session_id,
                            httponly=True,
                            secure=True,
                            samesite="Strict",
                        )
                        return response
            return self.json_response(False, {"error": "Failed to register"})

        @self.app.route("/api/projects", methods=["GET"])
        def projects():
            user_id = flask.g.user_id
            with self.database.session_scope():
                user = self.database.select_from(User, User.id == user_id)
                if not user:
                    return self.json_response(False, {"error": "User not found"}, 404)
                projects = user.projects
                projects = [p.to_dict() for p in projects]
            return self.json_response(True, {"projects": projects})

        @self.app.route("/api/projects", methods=["POST"])
        def create_project():
            data = flask.request.json
            if not data:
                return self.json_response(False, {"error": "Invalid request"}, 400)
            name = data.get("name")
            description = data.get("description")
            language = data.get("language")
            if name and description and language:
                with self.database.session_scope():
                    user_id = flask.g.user_id

                    project = self.database.add_project(
                        name, description, language, user_id
                    )

                    if project:
                        return self.json_response(True, project.to_dict())

            return self.json_response(False, {"error": "Failed to create project"})

        @self.app.route("/api/projects/<project_id>", methods=["DELETE"])
        def delete_project(project_id):
            with self.database.session_scope():
                project = self.database.select_from(
                    Project, Project.project_id == project_id
                )
                if not project:
                    return self.json_response(
                        False, {"error": "Project not found"}, 404
                    )

                # Check if user has access to the project
                allowed_users = [user.id for user in project.allowed_users]
                user_id = flask.g.user_id
                if user_id not in allowed_users:
                    return self.json_response(False, {"error": "Access denied"}, 403)

                self.database.delete_from(Project, Project.project_id == project_id)
                return self.json_response(True, {})

        @self.app.route("/api/projects/<project_id>", methods=["GET"])
        def project(project_id: str):
            with self.database.session_scope():
                project = self.database.select_from(
                    Project, Project.project_id == project_id
                )
                if not project:
                    return self.json_response(
                        False, {"error": "Project not found"}, 404
                    )

                # Check if user has access to the project
                allowed_users = [user.id for user in project.allowed_users]
                user_id = flask.g.user_id
                if user_id not in allowed_users:
                    return self.json_response(False, {"error": "Access denied"}, 403)

                response = self.json_response(True, project.to_dict())
                return response

        @self.app.route("/api/projects/<project_id>/addUser", methods=["POST"])
        def add_user(project_id: str):
            data = flask.request.json
            if not data:
                return self.json_response(False, {"error": "Invalid request"}, 400)
            email = data.get("email")
            if email:
                with self.database.session_scope():
                    project = self.database.select_from(
                        Project, Project.project_id == project_id
                    )
                    if not project:
                        return self.json_response(
                            False, {"error": "Project not found"}, 404
                        )

                    # Check if user has access to the project
                    allowed_users = [user.id for user in project.allowed_users]
                    user_id = flask.g.user_id
                    if user_id not in allowed_users:
                        return self.json_response(
                            False, {"error": "Access denied"}, 403
                        )

                    user = self.database.select_from(User, User.email == email)
                    if not user:
                        return self.json_response(
                            False, {"error": "User not found"}, 404
                        )

                    # Add user to project
                    self.database.add_allowed_user(project.id, user.id)

                    return self.json_response(True, project.to_dict())

            return self.json_response(False, {"error": "Failed to add user"})

        @self.app.route("/api/projects/<project_id>/removeUser", methods=["POST"])
        def remove_user(project_id: str):
            data = flask.request.json
            if not data:
                return self.json_response(False, {"error": "Invalid request"}, 400)
            email = data.get("email")
            if email:
                with self.database.session_scope():
                    project = self.database.select_from(
                        Project, Project.project_id == project_id
                    )
                    if not project:
                        return self.json_response(
                            False, {"error": "Project not found"}, 404
                        )

                    # Check if user has access to the project
                    allowed_users = [user.id for user in project.allowed_users]
                    user_id = flask.g.user_id
                    if user_id not in allowed_users:
                        return self.json_response(
                            False, {"error": "Access denied"}, 403
                        )

                    user = self.database.select_from(User, User.email == email)
                    if not user:
                        return self.json_response(
                            False, {"error": "User not found"}, 404
                        )

                    # Remove user from project
                    self.database.remove_allowed_user(project.id, user.id)

                    return self.json_response(True, project.to_dict())

            return self.json_response(False, {"error": "Failed to remove user"})

        @self.app.route("/api/user", methods=["GET"])
        def user():
            user_id = flask.g.user_id
            with self.database.session_scope():
                user = self.database.select_from(User, User.id == user_id)
                if not user:
                    return self.json_response(False, {"error": "User not found"}, 404)
                return self.json_response(True, user.to_dict())

        @self.app.before_request
        def before_request():
            """
            This function is called before each request is processed.
            It checks if the user is logged in by checking if the session_id cookie is set
            and if the session_id is valid.
            """
            if not flask.request.path.startswith("/api"):
                return
            if flask.request.path in ["/api/login", "/api/logout", "/api/register"]:
                return

            with self.database.session_scope():
                session_id = flask.request.cookies.get("session_id")
                if not session_id:
                    return self.json_response(False, {"error": "Not logged in"}, 401)
                if not self.database.validate_session(session_id):
                    return self.json_response(False, {"error": "Invalid session"}, 401)

                session = self.database.select_from(
                    Session, Session.session_id == session_id
                )
                user = self.database.select_from(User, User.id == session.user_id)
                if not user:
                    return self.json_response(False, {"error": "User not found"}, 404)
                flask.g.user_id = user.id

        @self.app.after_request
        def after_request(response):
            if not flask.request.path.startswith("/api"):
                return response
            if flask.request.path in ["/api/login", "/api/logout", "/api/register"]:
                return response
            if response.status_code != 200:
                return response

            # We need to update the session_id cookie to extend the session's lifetime
            session_id = flask.request.cookies.get("session_id")
            if session_id:
                response.set_cookie(
                    "session_id",
                    session_id,
                    httponly=True,
                    secure=True,
                    samesite="Strict",
                    max_age=SERVER.COOKIE_MAX_AGE,
                )
            return response

    def json_response(self, success: bool, data: dict[str, Any], status_code=200):
        return flask.make_response(
            flask.jsonify({"success": success, "data": data}), status_code
        )
