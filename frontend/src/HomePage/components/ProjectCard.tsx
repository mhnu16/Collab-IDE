import { useNavigate } from "react-router-dom";
import { Project } from "../../utils/ServerApi";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";

export default function ProjectCard({ project, deleteProject }: { project: Project, deleteProject: (project_id: string) => void }) {
    const navigate = useNavigate();

    return (
        <Paper
            elevation={3}
            sx={{
                p: 2,
                aspectRatio: '1',
                backgroundColor: (theme) =>
                    theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
            }}
        >
            <Grid container direction={'column'} sx={{ height: '100%' }}>
                <Grid item xs={3} width={'100%'} sx={{ overflow: 'clip'}}>
                    <Typography width={'100%'} variant='h5' sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</Typography>
                </Grid>
                <Grid item xs={6} width={'100%'} sx={{ overflow: 'hidden' }}>
                    <Typography width={'100%'} height={'100%'} variant='body1'>{project.description}</Typography>
                </Grid>
                <Grid container item xs={3} justifyContent={'space-between'}>
                    <Button onClick={() => navigate(`/projects/${project.project_id}`)}>Open</Button>
                    <Button onClick={() => deleteProject(project.project_id)}>Delete</Button>
                </Grid>
            </Grid>
        </Paper>
    )
}