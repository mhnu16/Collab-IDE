import flask
import flask_cors

from const import SERVER

from database import Database

from random import random


class ApiServer():

    def __init__(self, database: Database):
        self.database = database
        self.app = flask.Flask(__name__,
                               static_folder=SERVER.SERVE_PATH,
                               static_url_path='')
        self.cors = flask_cors.CORS(self.app, resources={r"/api/*": {"origins": "*"}})

        @self.app.route("/api/rand")
        def rand():
            return flask.jsonify(rand=random())

        @self.app.route("/")
        def index():
            return flask.send_from_directory(SERVER.SERVE_PATH, "index.html")

        @self.app.route("/<path:path>")
        def static_files(path):
            return flask.send_from_directory(SERVER.SERVE_PATH, path)

    def serve(self, debug=False):
        self.app.run(host=SERVER.IP, port=SERVER.PORT, debug=debug)
