import React from 'react';
import '../styles/EditorSidePanel.scss';
import { EditorContext } from '../CodeEditor';

export default function EditorSidePanel({ files, setFiles }: { files: string[], setFiles: React.Dispatch<React.SetStateAction<string[]>> }) {
    function createNewFile() {
        const new_file = prompt("Enter the name of the new file");
        if (new_file) {
            setFiles([...files, new_file]);
        }
    }

    return (
        <div className='editor-side-panel'>
            <div className='editor-side-panel__header'>
                <button onClick={() => window.location.href = '/'}>To Home</button>
                <h2>Files</h2>
                <button onClick={() => createNewFile()}>New File</button>
            </div>
            <div className='editor-files-panel'>
                {files.map((file) => <EditorFile key={file} label={file} />)}
            </div>
        </div >
    );
}

function EditorFile({ label }: { label: string }) {
    const { switchFile } = React.useContext(EditorContext);
    return (
        <div className='editor-file'>
            <p>{label}</p>
            <button onClick={() => switchFile(label)}>Open</button>
        </div>
    );
}
