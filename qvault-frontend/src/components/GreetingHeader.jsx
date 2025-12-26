import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { getGreeting } from '../utils/helpers';

export default function GreetingHeader({ userName }) {
    const { theme } = useTheme();

    const greeting = getGreeting(userName);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {greeting} 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
                Your files are encrypted and secure
            </p>
        </motion.div>
    );
}
