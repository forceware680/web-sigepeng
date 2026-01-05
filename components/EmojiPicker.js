'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function EmojiPicker({ isOpen, onClose, onSelect }) {
    const [activeCategory, setActiveCategory] = useState('smileys');

    const emojiCategories = {
        smileys: {
            name: '😀 Smileys',
            emojis: [
                '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
                '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
                '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩',
                '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
                '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
                '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗'
            ]
        },
        gestures: {
            name: '👋 Gestures',
            emojis: [
                '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
                '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
                '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
                '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂'
            ]
        },
        hearts: {
            name: '❤️ Hearts',
            emojis: [
                '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
                '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'
            ]
        },
        symbols: {
            name: '✅ Symbols',
            emojis: [
                '✅', '❌', '⭕', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫',
                '⚪', '🟤', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️',
                '✔️', '❗', '❓', '⚠️', '🔔', '🔕', '⭐', '🌟', '✨', '💫'
            ]
        },
        objects: {
            name: '📱 Objects',
            emojis: [
                '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💾', '💿', '📀',
                '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠', '📺', '📻',
                '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏰', '⏲️', '⌚', '📡', '🔋'
            ]
        },
        flags: {
            name: '🏁 Flags',
            emojis: [
                '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇮🇩', '🇺🇸',
                '🇬🇧', '🇯🇵', '🇰🇷', '🇨🇳', '🇫🇷', '🇩🇪', '🇮🇹', '🇪🇸', '🇷🇺', '🇧🇷'
            ]
        }
    };

    const handleEmojiClick = (emoji) => {
        onSelect(emoji);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div 
                className="emoji-picker-overlay"
                onClick={onClose}
            />
            
            {/* Emoji Picker Modal */}
            <div className="emoji-picker-modal">
                <div className="emoji-picker-header">
                    <h3>Pilih Emoji</h3>
                    <button 
                        type="button"
                        onClick={onClose}
                        className="emoji-picker-close"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Category Tabs */}
                <div className="emoji-categories">
                    {Object.keys(emojiCategories).map(category => (
                        <button
                            key={category}
                            type="button"
                            onClick={() => setActiveCategory(category)}
                            className={`emoji-category-btn ${activeCategory === category ? 'active' : ''}`}
                            title={emojiCategories[category].name}
                        >
                            {emojiCategories[category].emojis[0]}
                        </button>
                    ))}
                </div>

                {/* Emoji Grid */}
                <div className="emoji-grid">
                    {emojiCategories[activeCategory].emojis.map((emoji, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleEmojiClick(emoji)}
                            className="emoji-item"
                            title={emoji}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>

                <div className="emoji-picker-footer">
                    <p>💡 Tip: Tekan <kbd>Win + .</kbd> untuk emoji picker Windows</p>
                </div>
            </div>
        </>
    );
}
