import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";

export default function ErrorPage({ code }: { code: number }) {
    let message = '';

    switch (code) {
        case 404:
            message = 'The page you are looking for does not exist';
            break;
        case 403:
            message = 'You are not authorized to view this page';
            break;
        default:
            message = 'An unknown error occurred';
            break;
    }

    return (
        <Container maxWidth="sm">
            <CssBaseline />
            <Box my={4}>
                <Typography variant="h2" component="h1" gutterBottom>
                    Error {code}
                </Typography>
                <Typography variant="body1">
                    {message}
                </Typography>
            </Box>
        </Container>
    )
}