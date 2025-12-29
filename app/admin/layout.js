import AuthProvider from '@/components/AuthProvider';
import '../globals.css';
import './admin.css';

export const metadata = {
    title: 'Admin Dashboard - Tutorial Website',
};

export default function AdminLayout({ children }) {
    return (
        <AuthProvider>
            <div className="admin-layout">
                {children}
            </div>
        </AuthProvider>
    );
}
