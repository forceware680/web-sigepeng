import '../globals.css';
import './admin.css';

export const metadata = {
    title: 'Admin Dashboard - Tutorial Website',
};

export default function AdminLayout({ children }) {
    return (
        <div className="admin-layout">
            {children}
        </div>
    );
}

