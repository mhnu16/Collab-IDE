import flask

from const import SERVER

from database import Database

from random import random

class WebServer():

    def __init__(self, database: Database):
        self.database = database
        self.app = flask.Flask(__name__,
                               static_folder=SERVER.SERVE_PATH,
                               static_url_path='')

        @self.app.route("/")
        def index():
            return flask.send_from_directory(SERVER.SERVE_PATH, "index.html")

        @self.app.route("/rand")
        def rand():
            return flask.jsonify(num=random())

    def serve(self):
        self.app.run(host=SERVER.IP, port=SERVER.PORT, debug=False)
