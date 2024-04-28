import { Box, Button, Typography } from "@mui/material";
import AddCircleIcon from '@mui/icons-material/AddCircle';
export default function CreateProjectButton(props: { onClick: () => void }) {
    return (
        <Button
            variant="contained"
            color="primary"
            sx={{
                flexBasis: '10%',
                flexGrow: 0,
                flexShrink: 0,
                aspectRatio: '1',
                borderRadius: "16px",
            }}
            onClick={() => {
                props.onClick();
            }}
        >
            <Box>
                <AddCircleIcon sx={{ width: '50%', height: '50%' }} />
                <Typography variant='h5'>Create Project</Typography>
            </Box>
        </Button>
    );
}