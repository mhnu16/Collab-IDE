import React from "react";
import { useFormik } from "formik";
import "./styles/Login.scss";
import { UserResponse } from "./utils/ServerApi";
import { useAuth } from "./utils/Auth";
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
            auth.login(values).then((response: UserResponse) => {
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
}