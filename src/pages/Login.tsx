import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login: React.FC = () => {
	const navigate = useNavigate();
	const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

	const [isSignup, setIsSignup] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSuccess = async (credentialResponse: any) => {
		try {
			const { credential } = credentialResponse;
			const res = await axios.post(
				`${API_URL}/api/v1/auth/login/google`,
				{ token: credential }
			);
			const { access_token } = res.data;
			localStorage.setItem("token", access_token);
			navigate("/chat");
		} catch (error) {
			console.error("Login failed", error);
			alert("Google Login failed");
		}
	};

	const handleEmailAuth = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			if (isSignup) {
				await axios.post(`${API_URL}/api/v1/auth/signup`, {
					email,
					password,
				});
				const formData = new FormData();
				formData.append("username", email);
				formData.append("password", password);
				const res = await axios.post(
					`${API_URL}/api/v1/auth/login/access-token`,
					formData
				);
				localStorage.setItem("token", res.data.access_token);
				navigate("/chat");
			} else {
				const formData = new FormData();
				formData.append("username", email);
				formData.append("password", password);
				const res = await axios.post(
					`${API_URL}/api/v1/auth/login/access-token`,
					formData
				);
				localStorage.setItem("token", res.data.access_token);
				navigate("/chat");
			}
		} catch (error: any) {
			console.error("Auth failed", error);
			alert(error.response?.data?.detail || "Authentication failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex items-center justify-center h-screen bg-charcoal_blue-100 text-ash_grey-900">
			<div className="p-8 bg-charcoal_blue-200 rounded-lg shadow-lg text-center border border-charcoal_blue-300 w-96">
				<div className="mb-6 flex justify-center">
					<div className="w-16 h-16 bg-deep_teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-deep_teal-500/20">
						<span className="text-3xl font-bold text-white">E</span>
					</div>
				</div>
				<h1 className="text-3xl font-bold mb-2 text-ash_grey-900">
					Exo
				</h1>
				<p className="mb-6 text-ash_grey-500">Your external brain.</p>

				<form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
					<div>
						<input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full p-3 bg-charcoal_blue-300 border border-charcoal_blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep_teal-500 text-ash_grey-900 placeholder-ash_grey-600"
						/>
					</div>
					<div>
						<input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full p-3 bg-charcoal_blue-300 border border-charcoal_blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep_teal-500 text-ash_grey-900 placeholder-ash_grey-600"
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="w-full py-3 bg-deep_teal-500 hover:bg-deep_teal-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
					>
						{loading
							? "Processing..."
							: isSignup
							? "Sign Up"
							: "Log In"}
					</button>
				</form>

				<div className="flex items-center justify-between mb-6">
					<div className="h-px bg-charcoal_blue-400 flex-1"></div>
					<span className="px-2 text-sm text-ash_grey-600">OR</span>
					<div className="h-px bg-charcoal_blue-400 flex-1"></div>
				</div>

				<div className="flex justify-center mb-6">
					<GoogleLogin
						onSuccess={handleSuccess}
						onError={() => {
							console.log("Login Failed");
						}}
						theme="filled_black"
						shape="rectangular"
						text={isSignup ? "signup_with" : "signin_with"}
						width="320"
					/>
				</div>

				<div className="text-sm text-ash_grey-500">
					{isSignup
						? "Already have an account? "
						: "Don't have an account? "}
					<button
						onClick={() => setIsSignup(!isSignup)}
						className="text-deep_teal-400 hover:text-deep_teal-300 font-semibold focus:outline-none"
					>
						{isSignup ? "Log In" : "Sign Up"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default Login;
