import React from 'react';
import '../styles/EditorSidePanel.scss';
import { EditorContext } from '../CodeEditor';

export default function EditorSidePanel() {
    return (
        <div className='editor-side-panel'>
            <div className='editor-side-panel__header'>
                <h2>Files</h2>
            </div>
            <div className='editor-files-panel'>
                <EditorFile label="file1.py" />
                <EditorFile label="file2.py" />
                <EditorFile label="file3.py" />
            </div>
        </div>
    );
}

function EditorFile({ label }: { label: string }) {
    const { editor, setCurrentFile } = React.useContext(EditorContext);
    return (
        <div className='editor-file'>
            <p>{label}</p>
            <button onClick={() => setCurrentFile(label)}>Open</button>
        </div>
    );
}