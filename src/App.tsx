import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import { Analytics } from "@vercel/analytics/react";

// Replace with your actual Client ID or use env var
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
console.log("Loaded Client ID:", GOOGLE_CLIENT_ID); // Debugging

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
	const token = localStorage.getItem("token");
	if (!token) {
		return <Navigate to="/login" replace />;
	}
	return children;
};

function App() {
	return (
		<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
			<Router>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route
						path="/chat"
						element={
							<ProtectedRoute>
								<Chat />
							</ProtectedRoute>
						}
					/>
					<Route path="/" element={<Navigate to="/chat" replace />} />
				</Routes>
			</Router>
			<Analytics />
		</GoogleOAuthProvider>
	);
}

export default App;
