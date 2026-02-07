import { useState } from 'react';
import { useAuth } from '../context/Userauth';

export default function ProfileForm() {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [formData, setFormData] = useState({
        name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        bio: user?.user_metadata?.bio || '',
        location: user?.user_metadata?.location || '',
        tags: user?.user_metadata?.tags || [],
        profilePicture: user?.user_metadata?.avatar_url || 'https://via.placeholder.com/150'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Update user profile in Supabase
        console.log('Saving profile:', formData);
        setIsEditing(false);
    };

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    profilePicture: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && formData.tags.length < 8 && !formData.tags.includes(newTag)) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, newTag]
                }));
                setTagInput('');
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Profile</h1>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="cursor-pointer bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md font-medium transition"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center gap-4">
                    <img
                        src={formData.profilePicture}
                        alt="Profile"
                        className="h-32 w-32 rounded-full object-cover border-4 border-sky-500"
                    />
                    {isEditing && (
                        <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-sky-200 px-4 py-2 rounded-md text-sm transition">
                            Change Picture
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>

                {/* Name Field */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Display Name</label>
                    {isEditing ? (
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-md focus:outline-none focus:border-sky-500 transition"
                            placeholder="Enter your display name"
                        />
                    ) : (
                        <p className="text-white">{formData.name || 'Not provided'}</p>
                    )}
                </div>

                {/* Email Field (Read-only) */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                    <p className="text-zinc-400">{formData.email || 'Not provided'}</p>
                </div>

                {/* Bio Field */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Bio</label>
                    {isEditing ? (
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={4}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-md focus:outline-none focus:border-sky-500 transition resize-none"
                            placeholder="Tell us about yourself"
                        />
                    ) : (
                        <p className="text-zinc-300">{formData.bio || 'No bio provided'}</p>
                    )}
                </div>

                {/* Tags Field */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Tags <span className="text-zinc-500 text-xs">({formData.tags.length}/8)</span>
                    </label>
                    {isEditing ? (
                        <>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.tags.map(tag => (
                                    <span key={tag} className="bg-sky-500/20 text-sky-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="hover:text-white"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                disabled={formData.tags.length >= 8}
                                className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-md focus:outline-none focus:border-sky-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder={formData.tags.length >= 8 ? "Max tags reached" : "Type and press Enter to add tags"}
                            />
                        </>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {formData.tags.length > 0 ? (
                                formData.tags.map(tag => (
                                    <span key={tag} className="bg-sky-500/20 text-sky-300 text-xs px-2 py-1 rounded-full">
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <p className="text-zinc-300">No tags added</p>
                            )}
                        </div>
                    )}
                </div>


                {/* Form Actions */}
                {isEditing && (
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            className="cursor-pointer flex-1 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md font-medium transition"
                        >
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="cursor-pointer flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-md font-medium transition"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
