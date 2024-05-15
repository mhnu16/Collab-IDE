import React from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import InputAdornment from "@mui/material/InputAdornment";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";

import { NetworkContext } from "../CodeEditor";

/**
 * This is the terminal component. It is displayed at the bottom of the editor page.
 * It's opened by clicking the terminal button in the upper left corner of the editor page.
 * That sends an event to the backend to export the project's files and start the docker container.
 * The terminal is then connected to the container and displays the output of the commands.
 * Input is sent via an input field at the top of the terminal.
 */
export default function Terminal({ closeTerminal }: { closeTerminal: () => void }) {
    const sm = React.useContext(NetworkContext);
    const [input, setInput] = React.useState("");
    const [output, setOutput] = React.useState("");

    // Sets up the event listener for the terminal output
    React.useEffect(() => {
        sm.on("terminal_output", (data: string) => {
            setOutput(output + data);
        });
    }, [sm]);

    function sendInput() {
        sm.emit("terminal_input", input);
        setInput("");
    }

    return (
        <Paper elevation={1} sx={{ height: "40%", width: "100%", position: "absolute", bottom: 0, left: 0 }}>
            <Box display="flex" flexDirection="column" height="100%">
                <Box display="flex" justifyContent="space-between" p={1} gap={1}>
                    <TextField
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">{'>>'}</InputAdornment>,
                            endAdornment: <InputAdornment position="end">
                                <Button onClick={sendInput}>
                                    <SendIcon />
                                </Button>
                            </InputAdornment>
                        }}
                        fullWidth
                        variant="standard"
                    />
                    <Button variant="outlined" onClick={closeTerminal}>
                        <CloseIcon />
                    </Button>
                </Box>
                <Box m={1} height="100%" sx={{ overflow: "auto" }}>
                    <TextField
                        value={output}
                        onChange={(e) => setOutput(e.target.value)}
                        multiline
                        variant="outlined"
                        fullWidth
                        rows={11}
                        disabled
                        sx={{ backgroundColor: "#1c3c66" }}
                         />
                </Box>
            </Box>
        </Paper>
    );
}