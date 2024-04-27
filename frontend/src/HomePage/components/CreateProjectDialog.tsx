import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import React from "react";

export default function CreateProjectDialog(props: { open: boolean, onClose: () => void, onSubmit: (values: { name: string, description: string, language: string }) => void }) {
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [language, setLanguage] = React.useState('');

    return (
        <Dialog open={props.open} onClose={props.onClose}>
            <DialogTitle>Create Project</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label="Project Name"
                    type="text"
                    fullWidth
                    value={name}
                    required
                    onChange={(e) => setName(e.target.value)}
                />
                <TextField
                    margin="dense"
                    id="description"
                    label="Description"
                    type="text"
                    fullWidth
                    value={description}
                    required
                    multiline
                    rows={4}
                    onChange={(e) => setDescription(e.target.value)}
                    helperText={`${description.length} / 200`}
                    inputProps={{ maxLength: 200 }}
                />
                <Select
                    margin="dense"
                    id="language"
                    label="Language"
                    fullWidth
                    value={language}
                    required
                    onChange={(e) => setLanguage(e.target.value)}
                >
                    <MenuItem value={"python"}>python</MenuItem>
                    <MenuItem value={"javascript"}>javascript</MenuItem>
                    <MenuItem value={"typescript"}>typescript</MenuItem>
                </Select>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose}>Cancel</Button>
                <Button onClick={() => {
                    props.onSubmit({ name, description, language });
                    props.onClose();
                }}>Create</Button>
            </DialogActions>
        </Dialog>
    );
}