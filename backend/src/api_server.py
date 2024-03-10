from typing import Any
import flask
import flask_cors
import ssl

from const import SERVER

from database import Database, User, Session

from random import random


class ApiServer:

    def __init__(self, database: Database):
        self.database = database
        self.app = flask.Flask(__name__)
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
                self.database.delete_from(Session, Session.id == session_id)
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
