import json
import flask
import flask_socketio as fsock

from utils import SERVER
from database import Database

class SocketServer:
    def __init__(self, app: flask.Flask):
        self.app = app
        self.database = Database.get_instance()
        self.socketio = fsock.SocketIO(self.app, cors_allowed_origins="*", logger=True)

        @self.socketio.on("connect")
        def on_connect():
            print(f"{"-":>10} Client connected")

        @self.socketio.on("get_file")
        def on_get_file(json_str: str):
            data = json.loads(json_str)
            with self.database.session_scope():
                project_id = data.get("project_id")
                filename = data.get("filename")
                if project_id and filename:
                    file = self.database.get_file(project_id, filename)
                    if file:
                        self.emit("get_file", True, {"file": file})
                    else:
                        self.emit("get_file", False, {"error": "File not found"})
                

    def emit(self, event: str, success: bool, data: dict):
        self.socketio.emit(event, {"success": success, "data": data})

    def start(self, debug=False):
        self.socketio.run(
            self.app,
            host=SERVER.IP,
            port=SERVER.PORT,
            debug=debug,
            use_reloader=debug,
            log_output=debug,
        )
