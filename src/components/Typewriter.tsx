import React, { useState, useEffect } from "react";

interface TypewriterProps {
	text: string;
	speed?: number;
	onComplete?: () => void;
}

const Typewriter: React.FC<TypewriterProps> = ({
	text,
	speed = 10,
	onComplete,
}) => {
	const [displayedText, setDisplayedText] = useState("");
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		if (currentIndex < text.length) {
			const timeout = setTimeout(() => {
				setDisplayedText((prev) => prev + text[currentIndex]);
				setCurrentIndex((prev) => prev + 1);
			}, speed);

			return () => clearTimeout(timeout);
		} else {
			if (onComplete) {
				onComplete();
			}
		}
	}, [currentIndex, text, speed, onComplete]);

	// Reset if text changes completely (optional, depends on usage)
	useEffect(() => {
		if (text.startsWith(displayedText) && text !== displayedText) {
			// Continue typing
		} else if (!text.startsWith(displayedText)) {
			// New text, reset
			setDisplayedText("");
			setCurrentIndex(0);
		}
	}, [text]);

	return <span>{displayedText}</span>;
};

export default Typewriter;
