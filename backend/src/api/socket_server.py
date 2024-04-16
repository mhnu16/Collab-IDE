import json
import flask
import flask_socketio as fsock

from utils import SERVER
from database import Database, Project, Session, User

class SocketServer:
    def __init__(self, app: flask.Flask):
        self.app = app
        self.database = Database.get_instance()
        self.socketio = fsock.SocketIO(self.app, cors_allowed_origins="*", logger=True)

        @self.socketio.on("connect")
        def on_connect():
            print(f"{"-":>10} Client connected")
            project_id = flask.request.cookies.get("project_id")
            if not project_id:
                print("No project ID Provided")
                self.emit("connect_error", False, {"error": "No project ID Provided"})
                return
            session_id = flask.request.cookies.get("session_id")
            if not session_id:
                print("No session ID Provided")
                self.emit("connect_error", False, {"error": "No session ID Provided"})
                return
            with self.database.session_scope():
                session = self.database.select_from(Session, Session.session_id == session_id)
                if not session:
                    print("Invalid session ID")
                    self.emit("connect_error", False, {"error": "Invalid session ID"})
                    return
                user = self.database.select_from(User, User.id == session.user_id)
                if not user:
                    print("Invalid user ID")
                    self.emit("connect_error", False, {"error": "Invalid user ID"})
                    return
                projects_ids = [project.project_id for project in user.projects]
                if project_id not in projects_ids:
                    print("User does not have access to project")
                    self.emit("connect_error", False, {"error": "User does not have access to project"})
                    return
                fsock.join_room(project_id)
                print(f"{"-":>10} Client connected to project {project_id}")

        @self.socketio.on("disconnect")
        def on_disconnect():
            print(f"{"-":>10} Client disconnected")
            project_id = flask.request.args.get("project_id")
            if project_id:
                fsock.leave_room(project_id)
                print(f"{"-":>10} Client disconnected from project {project_id}")


        @self.socketio.on("get_file")
        def on_get_file(json_str: str):
            data = json.loads(json_str)
            filename = data.get("filename")
            project_id = flask.request.cookies.get("project_id")
            if project_id and filename:
                file = self.database.get_file(project_id, filename)
                if file:
                    self.emit("get_file", True, {"file": file}, to=flask.request.sid)
                else:
                    self.emit("get_file", False, {"error": "File not found"}, to=flask.request.sid)
            else:
                self.emit("get_file", False, {"error": "Invalid request"}, to=flask.request.sid)


    def emit(self, event: str, success: bool, data: dict, **kwargs):
        self.socketio.emit(event, {"success": success, "data": data}, **kwargs)

    def start(self, debug=False):
        self.socketio.run(
            self.app,
            host=SERVER.IP,
            port=SERVER.PORT,
            debug=debug,
            use_reloader=debug,
            log_output=debug,
        )
