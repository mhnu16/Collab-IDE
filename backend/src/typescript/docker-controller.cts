import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import yjsIO from './yjs-controller.cjs';
import { Stream } from 'stream';


export default class DockerController {
    private io: Server;
    private yjs: yjsIO;
    private docker: Docker = new Docker();
    private containers: Map<string, Container> = new Map();
    private containerPromises: Map<string, Promise<Container>> = new Map();

    constructor(io: Server, yjs: yjsIO) {
        this.io = io;
        this.yjs = yjs;
        this.buildImage();
        // Stops all containers when the server is stopped or occurs an error
        process.on('SIGINT', async () => {
            console.log('Stopping all containers');
            let containersInfo = await this.docker.listContainers({ all: true })
            for (let containerInfo of containersInfo) {
                // If the container is a code-executor container, remove it
                if (containerInfo.Image === 'code-executor') {
                    let container = this.docker.getContainer(containerInfo.Id);
                    await container.remove({ force: true });
                }
            }
            process.exit();
        });

        process.on('uncaughtException', async () => {
            console.log('Stopping all containers');
            let containersInfo = await this.docker.listContainers({ all: true })
            for (let containerInfo of containersInfo) {
                // If the container is a code-executor container, remove it
                if (containerInfo.Image === 'code-executor') {
                    let container = this.docker.getContainer(containerInfo.Id);
                    await container.remove({ force: true });
                }
            }
            process.exit();
        });
    }

    private async buildImage() {
        console.log(path.join(__dirname, '../docker'));
        await this.docker.buildImage({
            context: path.join(__dirname, '../docker'),
            src: ['Dockerfile']
        }, { t: 'code-executor' });
    }

    async createContainer(project_id: string) {
        if (this.containerPromises.has(project_id)) {
            let container = await this.containerPromises.get(project_id);
            return container;
        }

        let promise = new Promise<Container>((resolve, reject) => {
            let container = new Container(project_id, this.io, this.yjs);
            this.containers.set(project_id, container);
            resolve(container);
        });

        this.containerPromises.set(project_id, promise);
        let container = await promise;
        return container;

    }

    async stopContainer(project_id: string) {
        let container = this.containers.get(project_id);
        if (!container) {
            console.error(`No container for project ${project_id}`);
            return;
        }

        await container.remove();
    }

    async sendInput(project_id: string, input: string) {
        let container = this.containers.get(project_id);
        if (!container) {
            throw new Error(`No container for project ${project_id}`);
        }

        container.sendInput(input);
    }
}

class Container {
    private project_id: string;
    private io: Server;
    private yjs: yjsIO;
    private docker: Docker = new Docker();
    private container!: Docker.Container;
    private stdin!: NodeJS.ReadWriteStream;
    private stdout!: NodeJS.ReadWriteStream;

    constructor(project_id: string, io: Server, yjs: yjsIO) {
        this.project_id = project_id;
        this.io = io;
        this.yjs = yjs;
        this.create().then(async (container) => {
            this.container = container;
            this.stdin = await container.attach({ stream: true, stdin: true, hijack: true });
            this.stdout = await container.attach({ stream: true, stdout: true, stderr: true });
            this.stdout.on('data', (data) => {
                this.io.to(project_id).emit('terminal_output', data.toString());
            });
        })
    }

    private async create() {
        // Exports the project files
        let projectDir = await this.yjs.exportProjectToDirectory(this.project_id)

        let container = await this.docker.createContainer({
            Image: 'code-executor',
            name: this.project_id,
            Tty: true,
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            OpenStdin: true,
            StdinOnce: false,
            WorkingDir: '/app',
            HostConfig: {
                Binds: [`${projectDir}:/app`]
            },
            Cmd: ['bash'],
            Env: ['TERM=dumb'] // Makes the terminal output *DUMB*
        });

        container.start();
        return container;
    }

    public sendInput(input: string) {
        let t = this.stdin.write(input + '\n');
        console.log("[sendInput] t: ", t);
    }

    public async remove() {
        await this.container.remove({ force: true });
    }
}