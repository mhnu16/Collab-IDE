import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import Typography from "@mui/material/Typography";

import { Project } from "../../utils/ServerApi";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";

interface ProjectDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    project: Project | null;
    onAddUser: (userEmail: string) => void;
    onRemoveUser: (userEmail: string) => void;
    onExportProject: () => void;
}

export default function ProjectDetailsDialog({
    open,
    onClose,
    project,
    onAddUser,
    onRemoveUser,
    onExportProject,
}: ProjectDetailsDialogProps) {
    const [userEmail, setUserEmail] = React.useState("");

    if (!project) {
        return null;
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle variant="h3" >Project Details</DialogTitle>
            <DialogContent>
                <Divider />
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', height: '100%' }}>
                    <LabelValue label="Project Name" value={project.name} />
                    <LabelValue label="Project Description" value={project.description} />


                    <Typography variant="h6">Allowed Users</Typography>
                    <List sx={{ width: '100%' }}>
                        {project.allowed_users.map((user) => (
                            <Box key={user.email}>
                                <Divider />
                                <ListItem>
                                    <ListItemText primary={`${user.username} (${user.email})`} />
                                    <ListItemSecondaryAction>
                                        <IconButton edge="end" aria-label="delete" onClick={() => onRemoveUser(user.email)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                <Divider />
                            </Box>
                        ))}
                    </List>
                    <Divider />
                    <TextField
                        label="User email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                    />
                    <Button onClick={() => onAddUser(userEmail)}>Add User</Button>
                    <Divider />
                    <Button variant="contained" color="primary" onClick={() => onExportProject()}>
                        Export Project
                    </Button>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

function LabelValue({ label, value }: { label: string; value: string }) {
    return (
        <Box>
            <Typography variant="h6">{label}</Typography>
            <Typography variant="body1">{value}</Typography>
        </Box>
    );
}