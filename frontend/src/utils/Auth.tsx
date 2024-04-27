import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserResponse, sendRequest } from './ServerApi';
import LoadingPage from '../GenericPages/LoadingPage';

interface User {
    id: number;
    email: string;
    username: string;
}



let AuthContext = React.createContext<AuthContextType>(null!);

export function useAuth() {
    return React.useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    let [user, setUser] = React.useState<User>(null!);

    const login = ({ email, password }: { email: string, password: string }) => {
        return sendRequest<UserResponse>("api/login", "POST", { email, password })
            .then((response) => {
                if (response.success) {
                    console.log("Login successful");
                    console.log(response.data);
                    setUser(response.data);
                }
                return response;
            })
            .catch((error) => {
                console.error("Login failed: " + error);
                throw error;
            });
    }

    const logout = () => {
        return sendRequest("/api/logout", "POST")
            .then((response) => {
                if (response.success) {
                    setUser(null!);
                    window.location.href = "/login";
                }
            })
            .catch((error) => {
                console.error("Logout failed: " + error);
                throw error;
            });
    };

    const register = ({ username, email, password }: { username: string, email: string, password: string }) => {
        return sendRequest<UserResponse>("api/register", "POST", { username, email, password })
            .then((response) => {
                if (response.success) {
                    console.log("Register successful");
                    console.log(response.data);
                    setUser(response.data);
                }
                return response;
            })
            .catch((error) => {
                console.error("Register failed: " + error);
                throw error;
            });
    }

    const checkUser = () => {
        console.log("Checking user...");
        return sendRequest<UserResponse>('/api/user', 'GET')
            .then((response) => {
                if (response.success) {
                    setUser(response.data);
                }
                return response;
            })
            .catch((err) => {
                if (err.status === 401) {
                    console.error("User is not logged in!");
                }
                else {
                    console.error(`Error checking user: ${err.status}, ${err.statusText}`);
                }
                throw err;
            });
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, register, checkUser }}>
            {children}
        </AuthContext.Provider>
    );
}

interface AuthContextType {
    user: User;
    login: ({ email, password }: { email: string, password: string }) => Promise<UserResponse>;
    logout: () => Promise<void>;
    register: ({ username, email, password }: { username: string, email: string, password: string }) => Promise<UserResponse>;
    checkUser: () => Promise<UserResponse>;
}


export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    let [loading, setLoading] = React.useState(true);
    const auth = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        auth.checkUser()
            .then(() => setLoading(false))
            .catch(() => {
                navigate("/login");
            });
    }, []);

    // Show a loading screen while the user is being checked
    // This is important because the user will be null until the request is complete
    // Which would cause the user to be redirected to the login page, even if they are logged in
    if (loading) {
        return <LoadingPage />;
    } else {
        return <>{children}</>;
    }

}