import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaImage, FaTrash, FaToggleOn, FaToggleOff, FaSpinner, FaEye } from 'react-icons/fa';
import { bannerAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const BannerManagement = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newBanner, setNewBanner] = useState({
        title: '',
        link: '',
        targetAudience: 'both', // 'user', 'scrapper', 'both'
        displayOrder: 0,
        isActive: true
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const staticTexts = [
        "Please select an image",
        "Title is required",
        "Banner created successfully",
        "Failed to create banner",
        "Are you sure you want to delete this banner?",
        "Ad Banner Management",
        "Manage promotional banners for user and scrapper apps",
        "Add New Banner",
        "Create New Banner",
        "Title *",
        "Promotional Title",
        "Target Audience",
        "All Users (Both)",
        "Users Only",
        "Scrappers Only",
        "Link (Optional)",
        "Banner Image *",
        "Click to upload image",
        "Recommended size: 1200x400px",
        "Preview",
        "No image selected",
        "Cancel",
        "Creating...",
        "Create Banner",
        "No banners found. Create one to get started!",
        "All Users",
        "Deactivate",
        "Activate",
        "View Image",
        "Delete"
    ];
    const { getTranslatedText } = usePageTranslation(staticTexts);

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        setLoading(true);
        try {
            const response = await bannerAPI.getAllAdmin();
            if (response.success) {
                setBanners(response.data.banners || []);
            }
        } catch (error) {
            console.error('Failed to load banners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedImage) {
            alert(getTranslatedText('Please select an image'));
            return;
        }
        if (!newBanner.title) {
            alert(getTranslatedText('Title is required'));
            return;
        }

        setCreating(true);
        try {
            const formData = new FormData();
            formData.append('image', selectedImage);
            formData.append('title', newBanner.title);
            formData.append('link', newBanner.link);
            formData.append('targetAudience', newBanner.targetAudience);
            formData.append('displayOrder', newBanner.displayOrder);
            formData.append('isActive', newBanner.isActive);

            const response = await bannerAPI.create(formData);
            if (response.success) {
                alert(getTranslatedText('Banner created successfully'));
                setShowAddForm(false);
                resetForm();
                loadBanners();
            }
        } catch (error) {
            console.error('Error creating banner:', error);
            alert(getTranslatedText('Failed to create banner'));
        } finally {
            setCreating(false);
        }
    };

    const resetForm = () => {
        setNewBanner({
            title: '',
            link: '',
            targetAudience: 'both',
            displayOrder: 0,
            isActive: true
        });
        setSelectedImage(null);
        setImagePreview(null);
    };

    const handleToggleStatus = async (id) => {
        try {
            await bannerAPI.toggleStatus(id);
            loadBanners(); // Reload to refresh state
        } catch (error) {
            console.error('Error toggling banner status:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(getTranslatedText('Are you sure you want to delete this banner?'))) {
            try {
                await bannerAPI.delete(id);
                loadBanners();
            } catch (error) {
                console.error('Error deleting banner:', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-lg"
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{getTranslatedText("Ad Banner Management")}</h1>
                    <p className="text-gray-500">{getTranslatedText("Manage promotional banners for user and scrapper apps")}</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
                >
                    <FaPlus />
                    {getTranslatedText("Add New Banner")}
                </button>
            </motion.div>

            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-100">
                            <h2 className="text-lg font-bold mb-4 text-gray-700">{getTranslatedText("Create New Banner")}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">{getTranslatedText("Title *")}</label>
                                            <input
                                                type="text"
                                                value={newBanner.title}
                                                onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-green-500 focus:outline-none"
                                                placeholder={getTranslatedText("Promotional Title")}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">{getTranslatedText("Target Audience")}</label>
                                            <select
                                                value={newBanner.targetAudience}
                                                onChange={(e) => setNewBanner({ ...newBanner, targetAudience: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-green-500 focus:outline-none"
                                            >
                                                <option value="both">{getTranslatedText("All Users (Both)")}</option>
                                                <option value="user">{getTranslatedText("Users Only")}</option>
                                                <option value="scrapper">{getTranslatedText("Scrappers Only")}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">{getTranslatedText("Link (Optional)")}</label>
                                            <input
                                                type="text"
                                                value={newBanner.link}
                                                onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-green-500 focus:outline-none"
                                                placeholder="https://example.com/promo"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">{getTranslatedText("Banner Image *")}</label>
                                            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 hover:bg-gray-50 transition-colors text-center cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="flex flex-col items-center justify-center min-h-[100px]">
                                                    <FaImage className="text-3xl text-gray-400 mb-2" />
                                                    <span className="text-sm text-gray-500">
                                                        {selectedImage ? selectedImage.name : getTranslatedText('Click to upload image')}
                                                    </span>
                                                    <span className="text-xs text-gray-400 mt-1">{getTranslatedText("Recommended size: 1200x400px")}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl border p-4">
                                        <p className="text-sm font-semibold text-gray-500 mb-2">{getTranslatedText("Preview")}</p>
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="max-w-full max-h-48 object-contain rounded-lg shadow-md" />
                                        ) : (
                                            <div className="w-full h-32 flex items-center justify-center bg-gray-200 rounded-lg text-gray-400">
                                                {getTranslatedText("No image selected")}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddForm(false);
                                            resetForm();
                                        }}
                                        className="px-6 py-2 rounded-lg text-gray-600 font-semibold hover:bg-gray-100"
                                    >
                                        {getTranslatedText("Cancel")}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating || !selectedImage}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {creating && <FaSpinner className="animate-spin" />}
                                        {creating ? getTranslatedText('Creating...') : getTranslatedText('Create Banner')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <FaSpinner className="text-4xl text-green-600 animate-spin" />
                    </div>
                ) : banners.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow">
                        <p className="text-gray-500 text-lg">{getTranslatedText("No banners found. Create one to get started!")}</p>
                    </div>
                ) : (
                    banners.map((banner) => (
                        <motion.div
                            key={banner._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`bg-white rounded-2xl shadow-md overflow-hidden border-2 ${banner.isActive ? 'border-transparent' : 'border-gray-200 opacity-75'
                                }`}
                        >
                            <div className="relative h-48 bg-gray-100 group">
                                <img
                                    src={banner.imageUrl}
                                    alt={banner.title}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                    {banner.targetAudience === 'both' ? getTranslatedText('All Users') : banner.targetAudience === 'user' ? getTranslatedText('Users Only') : getTranslatedText('Scrappers Only')}
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-800 line-clamp-1" title={banner.title}>
                                        {banner.title}
                                    </h3>
                                    <button
                                        onClick={() => handleToggleStatus(banner._id)}
                                        className={`text-2xl transition-colors ${banner.isActive ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-500'
                                            }`}
                                        title={banner.isActive ? getTranslatedText('Deactivate') : getTranslatedText('Activate')}
                                    >
                                        {banner.isActive ? <FaToggleOn /> : <FaToggleOff />}
                                    </button>
                                </div>

                                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                    <span className="text-xs text-gray-500">
                                        {new Date(banner.createdAt).toLocaleDateString()}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => window.open(banner.imageUrl, '_blank')}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                            title={getTranslatedText("View Image")}
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(banner._id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title={getTranslatedText("Delete")}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BannerManagement;
