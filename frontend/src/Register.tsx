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
            auth.register(values).then((response: UserResponse) => {
                if (response.success) {
                    navigate("/");
                } else {
                    setError(response.data.error);
                }
            });
        },
    });

    return (
        <div className="container">
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

}