import ssl
import flask_socketio as fsock

from utils import SERVER


class SocketServer:
    def __init__(self, app, database):
        self.app = app
        self.database = database
        self.socketio = fsock.SocketIO(self.app, cors_allowed_origins="*")

        @self.socketio.on("connect")
        def on_connect():
            print("Client connected")

    def start(self, debug=False):
        context = ssl.SSLContext()
        context.load_cert_chain(
            SERVER.CERT_PATH, SERVER.KEY_PATH, SERVER.get_ssl_password()
        )
        self.socketio.run(
            self.app,
            host=SERVER.IP,
            port=SERVER.PORT,
            debug=debug,
            use_reloader=debug,
            log_output=debug,
            ssl_context=context,
        )
