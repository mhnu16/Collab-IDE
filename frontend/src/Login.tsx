import React from "react";
import { useFormik } from "formik";
import "./styles/Login.scss";
import { UserResponse, sendRequest } from "./ServerApi";
import { useAuth } from "./Auth";
import { useNavigate } from "react-router-dom";


export default function Login() {
    const [error, setError] = React.useState("");
    const auth = useAuth();
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: {
            email: "",
            password: "",
        },
        onSubmit: (values) => {
            sendLoginRequest(values.email, values.password);
        },
    });

    return (
        <div className="container">
            <h1>Login</h1>
            <form className="panel" onSubmit={formik.handleSubmit}>
                <div className="container">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        onChange={formik.handleChange}
                        value={formik.values.email}
                    />
                </div>
                <div className="container">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        onChange={formik.handleChange}
                        value={formik.values.password}
                    />
                </div>
                <button type="submit">Submit</button>
                <label hidden={!error} className="error-label">{error}</label>
            </form>
            <a href="/register">Click Here To Register</a>
        </div>
    );

    function sendLoginRequest(email: string, password: string) {
        sendRequest<UserResponse>("api/login", "POST", { email, password })
            .then((response) => {
                if (response.success) {
                    console.log("Login successful");
                    console.log(response.data.user);
                    auth.login(response.data.user);
                    navigate("/");
                } else {
                    console.error("Login failed: " + response.data.error);
                    setError(response.data.error);
                }
            })
            .catch((error) => {
                console.error("Login failed: " + error);
            });
    }
}