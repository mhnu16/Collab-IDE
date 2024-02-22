import flask
import flask_cors
import ssl

from const import SERVER

from database import Database

from random import random


class ApiServer:

    def __init__(self, database: Database):
        self.database = database
        self.app = flask.Flask(__name__)
        self.cors = flask_cors.CORS(self.app, resources={r"/api/*": {"origins": "*"}})

        @self.app.route("/api/rand")
        def rand():
            return flask.jsonify(rand=random())

    def serve(self, debug=False):
        context = ssl.SSLContext()
        context.load_cert_chain(
            SERVER.CERT_PATH, SERVER.KEY_PATH, SERVER.get_ssl_password()
        )
        self.app.run(host=SERVER.IP, port=SERVER.PORT, debug=debug, ssl_context=context)
