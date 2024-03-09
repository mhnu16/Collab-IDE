import React, { useContext } from 'react';
import { EditorContext } from '../CodeEditor';

export function FileExplorer() {
    const { setCurrentFile } = useContext(EditorContext);
    const [files, setFiles] = React.useState<string[]>(['file1.py', 'file2.py', 'file3.py']);

    return (
        <div>
            <h2>File Explorer</h2>
            <ul>
                {files.map(file => (
                    <li key={file}>
                        <button onClick={() => setCurrentFile(file)}>
                            {file}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}