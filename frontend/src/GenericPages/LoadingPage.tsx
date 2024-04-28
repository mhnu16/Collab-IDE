import logo from '/logo.svg';

import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';

export default function LoadingPage() {
    return (
        <Container maxWidth="sm">
            <CssBaseline />
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100%"
            >
                <img src={logo} alt="logo" />
                <CircularProgress />
            </Box>
        </Container>
    );
}