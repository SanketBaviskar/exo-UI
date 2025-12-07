import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	LogOut,
	Send,
	Plus,
	MessageSquare,
	FileText,
	CheckCircle,
	AlertCircle,
	Clock,
	Menu,
	Calendar,
	Trash,
	X,
} from "lucide-react";
import Typewriter from "../components/Typewriter";
import FileUpload from "../components/FileUpload";
import axios from "axios";

interface Message {
	role: "user" | "assistant";
	content: string;
}

interface Conversation {
	id: number;
	title: string;
	updated_at: string;
}

import { useGoogleLogin } from "@react-oauth/google";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Chat: React.FC = () => {
	const navigate = useNavigate();
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(false);
	const [conversationId, setConversationId] = useState<number | null>(null);
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [documents, setDocuments] = useState<
		{
			id: number;
			filename: string;
			status: string;
			error_message?: string;
		}[]
	>([]);
	const [isDriveConnected, setIsDriveConnected] = useState(false);
	const [syncing, setSyncing] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const handleLogout = () => {
		localStorage.removeItem("token");
		navigate("/login");
	};

	const fetchUser = async () => {
		try {
			const token = localStorage.getItem("token");
			const res = await axios.get(`${API_URL}/api/v1/users/me`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			setIsDriveConnected(res.data.google_drive_connected);
		} catch (error) {
			console.error("Failed to fetch user", error);
		}
	};

	const fetchConversations = async () => {
		try {
			const token = localStorage.getItem("token");
			const res = await axios.get(
				`${API_URL}/api/v1/chat/conversations`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			setConversations(res.data);
		} catch (error) {
			console.error("Failed to fetch conversations", error);
		}
	};

	const fetchDocuments = async () => {
		try {
			const token = localStorage.getItem("token");
			let url = `${API_URL}/api/v1/documents/`;
			if (conversationId) {
				url += `?conversation_id=${conversationId}`;
			}
			const res = await axios.get(url, {
				headers: { Authorization: `Bearer ${token}` },
			});
			setDocuments(res.data);
		} catch (error) {
			console.error("Failed to fetch documents", error);
		}
	};

	const fetchMessages = async (id: number) => {
		try {
			const token = localStorage.getItem("token");
			const res = await axios.get(
				`${API_URL}/api/v1/chat/${id}/messages`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			setMessages(res.data);
			setConversationId(id);
		} catch (error) {
			console.error("Failed to fetch messages", error);
		}
	};

	const connectDrive = useGoogleLogin({
		onSuccess: async (codeResponse) => {
			try {
				const token = localStorage.getItem("token");
				await axios.post(
					`${API_URL}/api/v1/auth/google-drive`,
					{
						code: codeResponse.code,
						redirect_uri: window.location.origin,
					},
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);
				setIsDriveConnected(true);
				alert("Google Drive connected!");
			} catch (error) {
				console.error("Failed to connect drive", error);
				alert("Failed to connect Google Drive");
			}
		},
		flow: "auth-code",
		scope: "https://www.googleapis.com/auth/drive.readonly",
	});

	const handleDeleteDocument = async (docId: number, e: React.MouseEvent) => {
		e.stopPropagation();
		if (!confirm("Are you sure you want to remove this file?")) return;

		try {
			const token = localStorage.getItem("token");
			await axios.delete(`${API_URL}/api/v1/documents/${docId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			fetchDocuments();
		} catch (error) {
			console.error("Failed to delete document", error);
			alert("Failed to delete document");
		}
	};

	const syncDrive = async () => {
		setSyncing(true);
		try {
			const token = localStorage.getItem("token");
			const res = await axios.post(
				`${API_URL}/api/v1/drive/sync`,
				{},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			alert(res.data.message);
		} catch (error) {
			console.error("Sync failed", error);
			alert("Sync failed");
		} finally {
			setSyncing(false);
		}
	};

	const syncCalendar = async () => {
		setSyncing(true);
		try {
			const token = localStorage.getItem("token");
			const res = await axios.post(
				`${API_URL}/api/v1/calendar/sync/google`,
				{},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			alert(res.data.message);
		} catch (error) {
			console.error("Calendar Sync failed", error);
			alert("Calendar Sync failed");
		} finally {
			setSyncing(false);
		}
	};

	useEffect(() => {
		fetchConversations();
		fetchUser();
	}, []);

	useEffect(() => {
		fetchDocuments();
	}, [conversationId]); // Refetch documents when conversation changes

	useEffect(() => {
		const hasPending = documents.some(
			(doc) => doc.status === "pending" || doc.status === "processing"
		);

		if (hasPending) {
			const interval = setInterval(fetchDocuments, 5000);
			return () => clearInterval(interval);
		}
	}, [documents]);

	const sendMessage = async () => {
		if (!input.trim()) return;

		const userMsg: Message = { role: "user", content: input };
		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setLoading(true);

		try {
			const token = localStorage.getItem("token");
			const res = await axios.post(
				`${API_URL}/api/v1/chat/`,
				{
					query: input,
					conversation_id: conversationId,
				},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			const assistantMsg: Message = {
				role: "assistant",
				content: res.data.answer,
			};
			setMessages((prev) => [...prev, assistantMsg]);

			if (res.data.conversation_id) {
				setConversationId(res.data.conversation_id);
				if (!conversationId) {
					fetchConversations();
				}
			}
		} catch (error) {
			console.error("Chat error", error);
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: "Error: Could not get response.",
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex h-screen bg-charcoal_blue-100 text-ash_grey-900 relative">
			{/* Mobile Overlay */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}

			<div
				className={`fixed inset-y-0 left-0 z-40 w-64 bg-charcoal_blue-200 p-4 flex flex-col border-r border-charcoal_blue-300 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
					isSidebarOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="mb-6 flex justify-between items-center">
					<h1 className="text-xl font-bold">Exo</h1>
					<button
						onClick={() => setIsSidebarOpen(false)}
						className="md:hidden text-gray-400 hover:text-white"
					>
						<X size={24} />
					</button>
				</div>
				<button
					onClick={() => {
						setConversationId(null);
						setMessages([]);
					}}
					className="flex items-center gap-2 bg-deep_teal-500 hover:bg-deep_teal-600 p-3 rounded-lg mb-4 transition-colors w-full text-white"
				>
					<Plus size={20} />
					<span>New Chat</span>
				</button>

				<div className="mb-4 p-3 bg-charcoal_blue-300 rounded-lg">
					<h3 className="text-sm font-semibold mb-2 text-ash_grey-600">
						Integrations
					</h3>
					{!isDriveConnected ? (
						<button
							onClick={() => connectDrive()}
							className="flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100 p-2 rounded w-full text-sm font-medium transition-colors"
						>
							<img
								src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
								alt="Drive"
								className="w-4 h-4"
							/>
							Connect Google
						</button>
					) : (
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-green-400 text-sm">
								<span className="w-2 h-2 bg-green-400 rounded-full"></span>
								Google Connected
							</div>
							<button
								onClick={syncDrive}
								disabled={syncing}
								className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 p-2 rounded w-full text-sm transition-colors disabled:opacity-50"
							>
								{syncing ? "Syncing..." : "Sync Files"}
							</button>
							<button
								onClick={syncCalendar}
								disabled={syncing}
								className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 p-2 rounded w-full text-sm transition-colors disabled:opacity-50"
							>
								<Calendar size={16} />
								{syncing ? "Syncing..." : "Sync Calendar"}
							</button>
						</div>
					)}
				</div>

				<div className="mb-4 p-3 bg-charcoal_blue-300 rounded-lg">
					<h3 className="text-sm font-semibold mb-2 text-ash_grey-600 flex items-center gap-2">
						<FileText size={16} />
						Documents
					</h3>
					<div className="space-y-1 max-h-32 overflow-y-auto">
						{documents.length === 0 ? (
							<div className="text-xs text-gray-500 italic">
								No documents
							</div>
						) : (
							documents.map((doc) => (
								<div
									key={doc.id}
									className="text-xs text-gray-400 flex items-center gap-2"
									title={doc.error_message || doc.filename}
								>
									{doc.status === "completed" && (
										<CheckCircle
											size={12}
											className="text-green-500"
										/>
									)}
									{doc.status === "failed" && (
										<AlertCircle
											size={12}
											className="text-red-500"
										/>
									)}
									{(doc.status === "pending" ||
										doc.status === "processing") && (
										<Clock
											size={12}
											className="text-yellow-500 animate-pulse"
										/>
									)}
									<span className="truncate flex-1">
										{doc.filename}
									</span>
									<button
										onClick={(e) =>
											handleDeleteDocument(doc.id, e)
										}
										className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
										title="Remove file"
									>
										<Trash size={12} />
									</button>
								</div>
							))
						)}
					</div>
				</div>

				<div className="flex-1 overflow-y-auto">
					<div className="text-gray-400 text-sm mb-2">Recent</div>
					{conversations.map((conv) => (
						<div
							key={conv.id}
							onClick={() => fetchMessages(conv.id)}
							className={`flex items-center gap-2 p-2 hover:bg-gray-700 rounded cursor-pointer text-gray-300 ${
								conversationId === conv.id ? "bg-gray-700" : ""
							}`}
						>
							<MessageSquare size={16} />
							<span className="truncate">
								{conv.title || `Conversation ${conv.id}`}
							</span>
						</div>
					))}
				</div>
				<div className="mt-auto pt-4 border-t border-gray-700">
					<button
						onClick={handleLogout}
						className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full p-2 rounded hover:bg-gray-700"
					>
						<LogOut size={18} />
						<span>Log out</span>
					</button>
				</div>
			</div>

			<div className="flex-1 flex flex-col w-full">
				<div className="md:hidden p-4 border-b border-charcoal_blue-300 flex items-center bg-charcoal_blue-200">
					<button
						onClick={() => setIsSidebarOpen(true)}
						className="text-gray-400 hover:text-white mr-4"
					>
						<Menu size={24} />
					</button>
					<h1 className="text-xl font-bold">Exo</h1>
				</div>
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{messages.length === 0 && (
						<div className="flex flex-col items-center justify-center h-full text-gray-500">
							<h2 className="text-2xl font-semibold mb-2">
								How can I help you today?
							</h2>
						</div>
					)}
					{messages.map((msg, idx) => (
						<div
							key={idx}
							className={`flex ${
								msg.role === "user"
									? "justify-end"
									: "justify-start"
							}`}
						>
							<div
								className={`max-w-3xl ${
									msg.role === "user"
										? "bg-dark_slate_grey-500 p-4 rounded-lg text-white"
										: "text-ash_grey-900 pl-0"
								}`}
							>
								<p className="whitespace-pre-wrap">
									{msg.role === "assistant" &&
									idx === messages.length - 1 ? (
										<Typewriter
											text={msg.content}
											speed={10}
										/>
									) : (
										msg.content
									)}
								</p>
							</div>
						</div>
					))}
					{loading && (
						<div className="flex justify-start">
							<div className="max-w-3xl p-4 rounded-lg bg-charcoal_blue-300 animate-pulse">
								<p>Thinking...</p>
							</div>
						</div>
					)}
				</div>

				<div className="p-4 bg-charcoal_blue-200 border-t border-charcoal_blue-300">
					<div className="max-w-4xl mx-auto relative flex items-center gap-2">
						<FileUpload
							onUploadSuccess={fetchDocuments}
							conversationId={conversationId}
						/>
						<div className="relative flex-1">
							<input
								type="text"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) =>
									e.key === "Enter" && sendMessage()
								}
								placeholder="Message Personal AI..."
								className="w-full bg-charcoal_blue-300 text-ash_grey-900 rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-muted_teal-500 placeholder-ash_grey-400"
							/>
							<button
								onClick={sendMessage}
								disabled={loading || !input.trim()}
								className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-deep_teal-500 rounded-lg hover:bg-deep_teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
							>
								<Send size={20} />
							</button>
						</div>
					</div>
					<div className="text-center text-xs text-gray-500 mt-2">
						AI can make mistakes. Check important info.
					</div>
				</div>
			</div>
		</div>
	);
};

export default Chat;
