import ShareDB from 'sharedb';
import { Connection } from 'sharedb/lib/client';
import shareDBMongo from 'sharedb-mongo';
import richText from 'rich-text';

class Database {
    private backend: ShareDB;
    private connection: Connection;

    constructor() {
        ShareDB.types.register(richText.type);

        const db = new shareDBMongo('mongodb://127.0.0.1:7000/docs');
        this.backend = new ShareDB({ db });
        this.connection = this.backend.connect();
    }

    public getProjectStructure(project_id: string) {
        /**
         * This function should return the project structure from the database
         * 
         * In the mongoDB database there's one collection for all the files
         * Each file has a project_id field that is used to identify the project
         */

        const files =  this.connection.collections.files
            .find({ project_id: project_id })
            .toArray();
    }

    public listen(stream: any) {
        this.backend.listen(stream);
    }
}

export default Database;