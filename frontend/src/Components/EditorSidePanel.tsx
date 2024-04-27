import React from 'react';
import { EditorContext, NetworkContext } from '../CodeEditor';


export default function EditorSidePanel({ files }: { files: string[] }) {
    const sm = React.useContext(NetworkContext)

    function createNewFile() {
        let newFileName = prompt('Enter the name of the new file');
        if (newFileName) {
            sm.emit('create_new_file', newFileName);
        }
    }

    return (
        <div className='editor__side-panel'>
            <div className='editor__side-panel__header'>
                <button onClick={() => window.location.href = '/'}>To Home</button>
                <button onClick={() => console.log('implement me!')}>Project Details</button>
            </div>
            <div className='editor__files-panel'>
                <div className='editor__side-panel__files-header'>
                    <h2>Files</h2>
                    <button onClick={() => createNewFile()}>New File</button>
                </div>
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
