import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserResponse, sendRequest } from './ServerApi';

interface User {
    id: number;
    email: string;
    username: string;
}

interface AuthContextType {
    user: User;
    login: (user: User) => void;
    logout: () => void;
}

let AuthContext = React.createContext<AuthContextType>(null!);

export function useAuth() {
    return React.useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    let [user, setUser] = React.useState<User>(null!);

    const login = (newUser: User) => {
        setUser(newUser);
    }

    const logout = () => {
        setUser(null!);
    };



    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}


export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    let [loading, setLoading] = React.useState(true);
    const auth = useAuth();

    React.useEffect(() => {
        sendRequest<UserResponse>('/api/user', 'GET')
            .then((response) => {
                if (response.success) {
                    auth.login(response.data.user);
                }
            })
            .catch((error) => {
                if (error.status === 401) {
                    console.error('Not logged in')
                }
            }).finally(() => {
                setLoading(false);
            })
    }, []);

    // Show a loading screen while the user is being checked
    // This is important because the user will be null until the request is complete
    // Which would cause the user to be redirected to the login page, even if they are logged in
    if (loading) {
        return <div>Loading...</div>;
    } else {
        if (!auth.user) {
            return <Navigate to="/login" />;
        }
        return <>{children}</>;
    }

}