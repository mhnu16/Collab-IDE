import React from 'react';
import { FuncContext, NetworkContext } from '../CodeEditor';

import NoteAddIcon from '@mui/icons-material/NoteAdd';
import DeleteIcon from '@mui/icons-material/Delete';

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';


export default function EditorSidePanel({ files, openTerminal }: { files: string[], openTerminal: () => void }) {
    const { switchFile, openProjectDetails } = React.useContext(FuncContext);
    const sm = React.useContext(NetworkContext)

    function createNewFile() {
        let newFileName = prompt('Enter the name of the new file');
        if (newFileName) {
            sm.emit('create_new_file', newFileName);
        }
    }

    return (
        <Paper elevation={6} sx={{ height: '100%', width: '100%' }}>
            <Grid container direction='column'>
                <Grid item xs={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', my: 2, mx: 1, gap: 1 }}>
                        <Button variant='outlined' onClick={() => window.location.href = '/'}>To Home</Button>
                        <Button variant='outlined' onClick={openProjectDetails}>Project Details</Button>
                        <Button variant='outlined' onClick={openTerminal}>Start Container</Button>
                    </Box>
                </Grid>
                <Grid item xs={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignContent: 'center', p: 1, my: 2 }}>
                        <Typography variant='h3'>Files</Typography>
                        <Button variant='contained' onClick={() => createNewFile()}>
                            <NoteAddIcon />
                            <Typography variant='button'>New File</Typography>
                        </Button>
                    </Box>
                </Grid>
                <Divider />
                <Grid item xs={8}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', px: 2, pt: 1 }}>
                        {files.map((file) => {
                            return (
                                <Box key={file} sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <Button variant='outlined' onClick={() => switchFile(file)} sx={{ my: 0.25, width: '100%', justifyContent: 'flex-start' }}>
                                        <Typography variant='body1' sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '80%',
                                            textTransform: 'none'
                                        }}>{file}</Typography>
                                    </Button>
                                    <Button onClick={() => {
                                        switchFile('')
                                        sm.emit('delete_file', file)
                                    }}>
                                        <DeleteIcon />
                                    </Button>
                                </Box>
                            );
                        })}
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
}