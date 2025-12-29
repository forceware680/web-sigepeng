'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
    const pathname = usePathname();
    const [tutorials, setTutorials] = useState([]);

    useEffect(() => {
        fetchTutorials();
    }, []);

    const fetchTutorials = async () => {
        try {
            const res = await fetch('/api/tutorials');
            const data = await res.json();
            setTutorials(data);
        } catch (error) {
            console.error('Failed to fetch tutorials:', error);
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1>📚 Tutorial</h1>
            </div>
            <nav className="sidebar-nav">
                <ul>
                    {tutorials.map((tutorial) => (
                        <li key={tutorial.id}>
                            <Link
                                href={`/tutorial/${tutorial.slug}`}
                                className={pathname === `/tutorial/${tutorial.slug}` ? 'active' : ''}
                            >
                                {tutorial.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="sidebar-footer">
                <Link href="/admin/login" className="admin-link">🔐 Admin</Link>
                <p>© 2024 Tutorial Website</p>
            </div>
        </aside>
    );
}
