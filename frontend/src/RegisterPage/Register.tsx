/** @jsxImportSource @emotion/react */
import React from 'react';

import logo from '/logo.svg';

import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import { AlertColor } from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import Typography from '@mui/material/Typography';
import { css, keyframes } from '@emotion/react';

import { useAuth } from '../utils/Auth';

const spin = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(180deg);
    }
`;

export default function RegisterPage() {
    const auth = useAuth();

    const [alertMessages, setAlertMessages] = React.useState<{ severity: AlertColor, msg: string }[]>([]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        let username = data.get('username') as string;
        let email = data.get('email') as string;
        let password = data.get('password') as string;

        if (!username || !email || !password) {
            setAlertMessages([...alertMessages, { msg: 'Please fill out all fields', severity: 'error' }]);
            return;
        }

        if (password.length < 8) {
            setAlertMessages([...alertMessages, { msg: 'Password must be at least 8 characters long', severity: 'error' }]);
            return;
        }
        else if (username.length < 4) {
            setAlertMessages([...alertMessages, { msg: 'Username must be at least 4 characters long', severity: 'error' }]);
            return;
        }
        // An email validation regex according to the RFC 5322 format
        let regex = new RegExp("([!#-'*+/-9=?A-Z^-~-]+(\.[!#-'*+/-9=?A-Z^-~-]+)*|\"\(\[\]!#-[^-~ \t]|(\\[\t -~]))+\")@([!#-'*+/-9=?A-Z^-~-]+(\.[!#-'*+/-9=?A-Z^-~-]+)*|\[[\t -Z^-~]*])");
        if (!regex.test(email)) {
            setAlertMessages([...alertMessages, { msg: 'Invalid email address', severity: 'error' }]);
            return;
        }

        auth.register({ username, email: email, password: password }).then((res) => {
            if (res.success) {
                window.location.href = '/';
            }
            else {
                setAlertMessages([...alertMessages, { msg: res.data.error, severity: 'error' }]);
            }
        })
    };

    return (
        <Grid container component="main" sx={{ height: '100vh' }}>
            <CssBaseline />
            <Grid
                item
                xs={false}
                sm={4}
                md={7}
                sx={{
                    backgroundColor: (t) =>
                        t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                }}
            >
                <Stack direction='column' sx={{ maxHeight: '100vh', overflow: 'auto' }}>
                    {alertMessages.map((alert, index) => (
                        <Alert key={index} severity={alert.severity} onClose={() => {
                            setAlertMessages(alertMessages.filter((_, i) => i !== index));
                        }}>
                            {alert.msg}
                        </Alert>
                    ))}
                </Stack>
            </Grid>
            <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                <Box
                    sx={{
                        my: 8,
                        mx: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                        <PersonAddIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Sign up
                    </Typography>
                    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label='Username'
                            name='username'
                            id='text'
                            type='text'
                            autoComplete='username'
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Email Address"
                            name="email"
                            id="email"
                            type="email"
                            autoComplete="email"
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Password"
                            name="password"
                            id="password"
                            type="password"
                            autoComplete="current-password"
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Sign Up
                        </Button>
                        <Grid container justifyContent={'center'}>
                            <Grid item>
                                <Link href="/login" variant="body2">
                                    {"Already have an account? Sign In"}
                                </Link>
                            </Grid>
                        </Grid>
                        <Box display='flex' sx={{ mt: 5 }} justifyContent={'center'}>
                            <img src={logo} alt="logo" css={
                                css`
                                    animation: ${spin} infinite 3s ease-in-out alternate;
                                    height: 50%;
                                    width: 50%;
                                `
                            }
                            />
                        </Box>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
}