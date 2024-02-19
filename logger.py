import logging


class Logger:

    def __init__(self, name="main", level=logging.DEBUG):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)
        self.formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s')
        self.fh = logging.FileHandler('latest.log')
        self.fh.setLevel(level)
        self.fh.setFormatter(self.formatter)
        self.logger.addHandler(self.fh)

    def info(self, message):
        self.logger.info(message)

    def warning(self, message):
        self.logger.warning(message)

    def error(self, message):
        self.logger.error(message)

    def critical(self, message):
        self.logger.critical(message)

    def debug(self, message):
        self.logger.debug(message)
