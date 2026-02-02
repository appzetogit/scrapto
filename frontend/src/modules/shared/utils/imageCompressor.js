
/**
 * Compresses an image file by resizing (if needed) and adjusting quality.
 * @param {File} file - The file to compress
 * @param {Object} options - Compression options
 * @param {number} [options.maxWidth=1920] - Max width
 * @param {number} [options.maxHeight=1920] - Max height
 * @param {number} [options.quality=0.8] - JPEG quality (0 to 1)
 * @returns {Promise<File>} - Compressed file
 */
export const compressImage = async (file, options = {}) => {
    const {
        maxWidth = 1920,
        maxHeight = 1920,
        quality = 0.8,
    } = options;

    // If it's not an image, return original
    if (!file.type.startsWith('image/')) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob/file
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            // Fallback to original if compression fails
                            resolve(file);
                            return;
                        }
                        // Create new file with original name and type (or 'image/jpeg' if we want to force jpeg)
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });

                        // If compressed is somehow larger, return original
                        if (compressedFile.size > file.size) {
                            resolve(file);
                        } else {
                            resolve(compressedFile);
                        }
                    },
                    file.type,
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

/**
 * Compresses multiple image files
 * @param {File[]} files - Array of files
 * @returns {Promise<File[]>}
 */
export const compressImages = async (files) => {
    return Promise.all(Array.from(files).map((file) => compressImage(file)));
};
