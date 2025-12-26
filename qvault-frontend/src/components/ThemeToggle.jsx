import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="flex items-center gap-4">
            {/* Dark Mode Text (Visible on Left when Dark) */}
            <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: isDark ? 1 : 0, x: isDark ? 0 : 20 }}
                className={`text-xs font-bold tracking-widest ${isDark ? 'text-gray-200' : 'text-transparent'}`}
            >
                {isDark ? 'DARK MODE' : ''}
            </motion.span>

            <button
                onClick={toggleTheme}
                className="relative w-16 h-8 rounded-full shadow-inner transition-colors duration-300 focus:outline-none"
                style={{
                    backgroundColor: isDark ? '#334155' : '#e2e8f0',
                    border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`
                }}
                aria-label="Toggle theme"
            >
                <motion.div
                    className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow-md flex items-center justify-center bg-white"
                    animate={{ x: isDark ? 32 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                    {isDark ? (
                        <Moon className="w-4 h-4 text-blue-500 fill-blue-500" />
                    ) : (
                        <Sun className="w-4 h-4 text-amber-500 fill-amber-500" />
                    )}
                </motion.div>
            </button>

            {/* Light Mode Text (Visible on Right when Light) */}
            <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: !isDark ? 1 : 0, x: !isDark ? 0 : -20 }}
                className={`text-xs font-bold tracking-widest ${!isDark ? 'text-gray-600' : 'text-transparent'}`}
            >
                {!isDark ? 'LIGHT MODE' : ''}
            </motion.span>
        </div>
    );
}
