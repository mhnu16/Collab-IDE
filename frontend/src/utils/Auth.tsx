import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserResponse, sendRequest } from './ServerApi';
import LoadingPage from '../Components/LoadingPage';

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
                    console.error("Check user failed: " + err);
                }
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

    React.useEffect(() => {
        auth.checkUser().then(() => {
            setLoading(false);
        }).catch((error) => {
            console.error("Check user failed: " + error);
            setLoading(false);
        });
    }, []);

    // Show a loading screen while the user is being checked
    // This is important because the user will be null until the request is complete
    // Which would cause the user to be redirected to the login page, even if they are logged in
    if (loading) {
        return <LoadingPage />;
    } else {
        if (!auth.user) {
            return <Navigate to="/login" />;
        }
        return <>{children}</>;
    }

}