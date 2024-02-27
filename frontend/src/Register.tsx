import React from "react";
import { useFormik } from "formik";
import "./styles/Register.scss";
import { UserResponse, sendRequest } from "./ServerApi";
import { useAuth } from "./Auth";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const [error, setError] = React.useState("");
    const auth = useAuth();
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: {
            username: "",
            email: "",
            password: "",
        },
        onSubmit: (values) => {
            sendRegisterRequest(values.username, values.email, values.password);
        },
    });

    return (
        <div>
            <h1>Register</h1>
            <form className="register-form" onSubmit={formik.handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Username</label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        onChange={formik.handleChange}
                        value={formik.values.username}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        onChange={formik.handleChange}
                        value={formik.values.email}
                    />
                </div>
                <div className="form-group">
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
            <a href="/login">Click Here To Login</a>
        </div>
    );

    function sendRegisterRequest(username: string, email: string, password: string) {
        sendRequest<UserResponse>("api/register", "POST", { username, email, password })
            .then((response) => {
                if (response.success) {
                    console.log("Register successful");
                    console.log(response.data.user);
                    auth.login(response.data.user);
                    navigate("/");
                } else {
                    console.error("Register failed: " + response.data.error);
                    setError(response.data.error);
                }
            })
            .catch((error) => {
                console.error("Register failed: " + error);
            });
    }
}