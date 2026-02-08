import { useState, useEffect } from 'react';
import { useAuth } from '../context/Userauth';
import { supabase } from '../lib/supabaseClient';

export default function ProfileForm() {
    const { user, refreshProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        bio: '',
        tags: [] as string[],
        profilePicture: 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg'
    });

    useEffect(() => {
        const cachedProfile = localStorage.getItem(`profile_${user?.id}`);
        if (cachedProfile) {
            try {
                const parsed = JSON.parse(cachedProfile);
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Cache parse error", e);
            }
        }

        async function fetchProfile() {
            if (!user) return;
            if (!localStorage.getItem(`profile_${user.id}`)) {
                setLoading(true);
            }
            try {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select(`
                        username,
                        bio,
                        profile_picture_url,
                        profile_tags (
                            tag_name
                        )
                    `)
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileError) throw profileError;

                if (profileData) {
                    const tags = profileData.profile_tags
                        ? (profileData.profile_tags as any[]).map(t => t.tag_name)
                        : [];

                    const newProfile = {
                        username: profileData.username || '',
                        bio: profileData.bio || '',
                        tags: tags,
                        profilePicture: profileData.profile_picture_url || 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg'
                    };

                    setFormData(newProfile);
                    localStorage.setItem(`profile_${user.id}`, JSON.stringify(newProfile));
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            let profilePictureUrl = formData.profilePicture;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `profiles/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('profile-pictures')
                    .upload(filePath, imageFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(filePath);

                profilePictureUrl = publicUrl;
            }

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: formData.username,
                    bio: formData.bio,
                    profile_picture_url: profilePictureUrl,
                });

            if (profileError) throw profileError;

            const { error: deleteError } = await supabase
                .from('profile_tags')
                .delete()
                .eq('profile_id', user.id);

            if (deleteError) throw deleteError;

            if (formData.tags.length > 0) {
                const tagsToInsert = formData.tags.map(tag => ({
                    profile_id: user.id,
                    tag_name: tag
                }));

                const { error: insertError } = await supabase
                    .from('profile_tags')
                    .insert(tagsToInsert);

                if (insertError) throw insertError;
            }

            const finalProfile = {
                ...formData,
                profilePicture: profilePictureUrl
            };

            setFormData(finalProfile);
            localStorage.setItem(`profile_${user.id}`, JSON.stringify(finalProfile));

            await refreshProfile();

            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            alert(`Failed to update profile: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
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

    if (loading && !isEditing) {
        return (
            <div className="w-full max-w-2xl mx-auto p-12 bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-zinc-400">Loading profile...</p>
            </div>
        );
    }

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

            <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                        <img
                            src={formData.profilePicture}
                            alt="Profile"
                            key={formData.profilePicture}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg';
                            }}
                            className="h-32 w-32 rounded-full object-cover border-4 border-sky-500 shadow-xl"
                        />
                        {loading && (
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
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

                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Username</label>
                    {isEditing ? (
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-md focus:outline-none focus:border-sky-500 transition"
                            placeholder="Enter your username"
                        />
                    ) : (
                        <p className="text-white">{formData.username || 'Not provided'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                    <p className="text-zinc-400">{user?.email || 'Not provided'}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Bio</label>
                    {isEditing ? (
                        <>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows={4}
                                className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-md focus:outline-none focus:border-sky-500 transition resize-none"
                                placeholder="Tell us about yourself..."
                                maxLength={500}
                            />
                            <p className="text-xs text-zinc-500 mt-1">{formData.bio?.length || 0}/500 characters</p>
                        </>
                    ) : (
                        <p className="text-white whitespace-pre-wrap">{formData.bio || 'No bio added'}</p>
                    )}
                </div>

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

                {isEditing && (
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="cursor-pointer flex-1 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md font-medium transition disabled:bg-zinc-700"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
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
