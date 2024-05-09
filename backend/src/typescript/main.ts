import Server from "./server";

const HOST = '127.0.0.1';
const PORT = 7000;

const server = new Server(HOST, PORT);

server.listen();