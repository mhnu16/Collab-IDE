import React from 'react';
import './styles/EditorSidePanel.scss';
import { EditorContext } from './CodeEditor';
import * as monaco from 'monaco-editor';

export default function EditorSidePanel() {
    return (
        <div className='editor-side-panel'>
            <div className='editor-side-panel__header'>
                <h2>Files</h2>
            </div>
            <EditorFilesPanel></EditorFilesPanel>
        </div>
    );
}

function EditorFilesPanel() {
    return (
        <div className='editor-files-panel'>
            <EditorFile label="file1.py" />
            <EditorFile label="file2.py" />
            <EditorFile label="file3.py" />
        </div>
    );
}

function EditorFile({ label }: { label: string }) {
    const editor = React.useContext(EditorContext);
    return (
        <div className='editor-file'>
            <p>{label}</p>
            <button onClick={() => openFile(editor, label)}>Open</button>
        </div>
    );
}

function openFile(editor: monaco.editor.IStandaloneCodeEditor | null, label: string) {
    if (editor) {
        editor.setModel(monaco.editor.getModel(monaco.Uri.parse(`file:///${label}`)));
        
    }
}