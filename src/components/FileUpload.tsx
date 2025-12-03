import React, { useState, useRef } from "react";
import axios from "axios";
import { Paperclip, FileText } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface FileUploadProps {
	onUploadSuccess?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
	const [uploading, setUploading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (file.type !== "application/pdf") {
			setMessage("Only PDF files are allowed.");
			setTimeout(() => setMessage(null), 3000);
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			setMessage("File too large. Limit is 10MB.");
			setTimeout(() => setMessage(null), 3000);
			return;
		}

		setUploading(true);
		setMessage(null);

		const formData = new FormData();
		formData.append("file", file);

		try {
			const token = localStorage.getItem("token");
			await axios.post(
				`${API_URL}/api/v1/documents/upload/pdf`,
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${token}`,
					},
				}
			);
			setMessage(`Uploaded ${file.name} successfully!`);
			if (onUploadSuccess) {
				onUploadSuccess();
			}
		} catch (error) {
			console.error("Upload failed", error);
			setMessage("Failed to upload file.");
		} finally {
			setUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			setTimeout(() => setMessage(null), 5000);
		}
	};

	return (
		<div className="relative">
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileChange}
				accept=".pdf"
				className="hidden"
			/>
			<button
				onClick={() => fileInputRef.current?.click()}
				disabled={uploading}
				className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
				title="Upload PDF"
			>
				<Paperclip size={20} />
			</button>

			{message && (
				<div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 text-white text-xs p-2 rounded shadow-lg border border-gray-700 flex items-center gap-2">
					{uploading ? (
						<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
					) : (
						<FileText size={14} className="text-muted_teal-500" />
					)}
					<span>{message}</span>
				</div>
			)}
		</div>
	);
};

export default FileUpload;
