import { useState } from "react";
import { useFormik } from "formik";
import "./styles/Login.scss";
import { ApiResponse, sendRequest } from "./ServerApi";



export default function Login() {
    const [error, setError] = useState("");

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
        <div>
            <h1>Login</h1>
            <form className="login-form" onSubmit={formik.handleSubmit}>
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
        </div>
    );

    // If the response is successful, the data will contain the user object. otherwise, it will contain an error message.
    interface LoginResponse extends ApiResponse {
        data: {
            user?: {
                id: number;
                email: string;
                name: string;
            };
            error?: string;
        };
    }

    function sendLoginRequest(email: string, password: string) {
        sendRequest<LoginResponse>("api/login", "POST", { email, password })
            .then((response) => {
                if (response.success) {
                    console.log("Login successful");
                    console.log(response.data.user);
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