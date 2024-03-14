import os
from typing import Any
import flask
import flask_cors
import ssl

from utils import SERVER

from database import Database, User, Session, Project

from random import random


class ApiServer:

    def __init__(self, database: Database):
        self.database = database
        self.app = flask.Flask(__name__)
        # TODO: Check if this is needed
        self.cors = flask_cors.CORS(
            self.app, resources={r"/api/*": {"origins": "https://localhost:3000"}}
        )

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
                user = self.database.select_from(
                    User, User.email == email, User.password == password
                )
                if user:
                    session_id = self.database.add_session(user.id)
                    # Set cookie
                    response = self.json_response(True, {"user": user.to_dict()})
                    response.set_cookie(
                        "session_id",
                        session_id,
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
                user_id = self.database.add_user(username, email, password)
                if user_id != -1:
                    session_id = self.database.add_session(user_id)
                    user = self.database.select_from(User, User.id == user_id)
                    response = self.json_response(True, {"user": user.to_dict()})
                    response.set_cookie(
                        "session_id",
                        session_id,
                        httponly=True,
                        secure=True,
                        samesite="Strict",
                    )
                    return response
            return self.json_response(False, {"error": "Failed to register"})

        @self.app.route("/api/projects", methods=["GET"])
        def projects():
            user = flask.g.user
            projects = self.database.select_from(User, User.id == user.id).projects
            return self.json_response(
                True, {"projects": [p.to_dict() for p in projects]}
            )

        @self.app.route("/api/projects", methods=["POST"])
        def create_project():
            user = flask.g.user
            data = flask.request.json
            if not data:
                return self.json_response(False, {"error": "Invalid request"}, 400)
            name = data.get("name")
            description = data.get("description")
            language = data.get("language")
            if name and description and language:
                project_id = os.urandom(16).hex()
                project_id = self.database.add_project(
                    project_id, name, description, language, user.id
                )

                if project_id != -1:
                    project = self.database.select_from(
                        Project, Project.id == project_id
                    )
                    return self.json_response(True, {"project": project.to_dict()})
            return self.json_response(False, {"error": "Failed to create project"})

        @self.app.route("/api/projects/<project_id>", methods=["DELETE"])
        def delete_project(project_id):
            user = flask.g.user
            project = self.database.select_from(Project, Project.id == project_id)
            if not project:
                return self.json_response(False, {"error": "Project not found"}, 404)

            # Check if user has access to the project
            allowed_users = [user.id for user in project.allowed_users]
            if user.id not in allowed_users:
                return self.json_response(False, {"error": "Access denied"}, 403)

            self.database.delete_from(Project, Project.id == project_id)

            return self.json_response(True, {})

        @self.app.route("/api/projects/<project_id>", methods=["GET"])
        def project(project_id):
            user = flask.g.user
            project = self.database.select_from(Project, Project.id == project_id)
            if not project:
                return self.json_response(False, {"error": "Project not found"}, 404)

            # Check if user has access to the project
            allowed_users = [user.id for user in project.allowed_users]
            if user.id not in allowed_users:
                return self.json_response(False, {"error": "Access denied"}, 403)

            # TODO: I probably need to establish a websocket connection here, to allow for real-time communication

            return self.json_response(True, {"project": project.to_dict()})

        @self.app.route("/api/user", methods=["GET"])
        def user():
            user = flask.g.user
            return self.json_response(True, {"user": user.to_dict()})

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

            session_id = flask.request.cookies.get("session_id")
            if not session_id:
                return self.json_response(False, {"error": "Not logged in"}, 401)
                # return flask.redirect("/login")
            if not self.database.validate_session(session_id):
                return self.json_response(False, {"error": "Invalid session"}, 401)
                # return flask.redirect("/login")

            session = self.database.select_from(
                Session, Session.session_id == session_id
            )
            user = self.database.select_from(User, User.id == session.user_id)
            flask.g.user = user  # This allows us to access the user object while processing the request

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

    def serve(self, debug=False):
        context = ssl.SSLContext()
        context.load_cert_chain(
            SERVER.CERT_PATH, SERVER.KEY_PATH, SERVER.get_ssl_password()
        )
        self.app.run(host=SERVER.IP, port=SERVER.PORT, debug=debug, ssl_context=context)
