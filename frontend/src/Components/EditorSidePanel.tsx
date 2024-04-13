import React from 'react';
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
        <div className='editor__side-panel'>
            <div className='editor__side-panel__header'>
                <button onClick={() => window.location.href = '/'}>To Home</button>
                <button onClick={() => createNewFile()}>New File</button>
            </div>
            <div className='editor__files-panel'>
                <h2 className='editor__side-panel__files-header'>Files</h2>
                {files.map((file) => <EditorFile key={file} label={file} />)}
            </div>
        </div >
    );
}

function EditorFile({ label }: { label: string }) {
    const { switchFile } = React.useContext(EditorContext);
    return (
        <div className='editor__file'>
            <button onClick={() => switchFile(label)}>{label}</button>
        </div>
    );
}
