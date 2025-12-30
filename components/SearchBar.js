'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, Folder, Loader2 } from 'lucide-react';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);
    const router = useRouter();

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data.results || []);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (result) => {
        if (result.url) {
            router.push(result.url);
        }
        setQuery('');
        setIsOpen(false);
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
    };

    return (
        <div className="search-container" ref={searchRef}>
            <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Cari tutorial..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="search-input"
                />
                {query && (
                    <button onClick={clearSearch} className="search-clear">
                        <X size={16} />
                    </button>
                )}
                {loading && <Loader2 size={16} className="search-loading" />}
            </div>

            {isOpen && query.length >= 2 && (
                <div className="search-results">
                    {results.length === 0 && !loading && (
                        <div className="search-no-results">
                            Tidak ditemukan hasil untuk "{query}"
                        </div>
                    )}

                    {results.map((result) => (
                        <div
                            key={`${result.type}-${result.id}`}
                            className={`search-result-item ${result.type}`}
                            onClick={() => handleResultClick(result)}
                        >
                            <div className="search-result-icon">
                                {result.type === 'category' ? (
                                    <Folder size={18} />
                                ) : (
                                    <FileText size={18} />
                                )}
                            </div>
                            <div className="search-result-content">
                                <div className="search-result-title">
                                    {result.title}
                                </div>
                                <div className="search-result-meta">
                                    {result.type === 'category' ? (
                                        <>
                                            <span className="result-type-badge category">Kategori</span>
                                            {result.categoryPath && result.categoryPath !== result.title && (
                                                <span className="result-category">{result.categoryPath}</span>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <span className="result-type-badge tutorial">Tutorial</span>
                                            <span className="result-category">{result.categoryPath}</span>
                                        </>
                                    )}
                                    <span className="result-match">• {result.matchedIn}</span>
                                </div>
                                {result.excerpt && (
                                    <div className="search-result-excerpt">
                                        {result.excerpt}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
