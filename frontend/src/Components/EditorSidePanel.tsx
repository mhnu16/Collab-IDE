import React from 'react';
import '../styles/EditorSidePanel.scss';
import { EditorContext, NetworkContext, ProjectContext } from '../CodeEditor';

export default function EditorSidePanel({ files, setFileStructure }: { files: string[], setFileStructure: React.Dispatch<React.SetStateAction<string[]>> }) {
    let sm = React.useContext(NetworkContext)
    let project = React.useContext(ProjectContext);

    function createNewFile() {
        let new_file = prompt("Enter the name of the new file");
        if (new_file) {
            sm.sendEvent('createFile', { project_id: project.project_id, file_name: new_file }, (response) => {
                if (response.success) {
                    setFileStructure([...files, new_file as string]);
                } else {
                    alert('Failed to create file');
                }
            });
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
