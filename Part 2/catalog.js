// catalog.js
const products = new Map();
let nextId = 1;

function createProduct(data) {
    // Check for duplicate SKU
    for (const product of products.values()) {
        if (product.sku === data.sku) {
            return { error: "duplicate_sku" };
        }
    }

    const newProduct = {
        id: nextId.toString(),
        name: data.name,
        sku: data.sku,
        image_urls: data.image_urls || [],
        video_urls: data.video_urls || [],
        created_at: new Date().toISOString()
    };

    products.set(newProduct.id, newProduct);
    nextId++;
    
    return newProduct;
}

function getProductsList(limit, offset) {
    const allProducts = Array.from(products.values());
    
    // Apply pagination
    const paginatedProducts = allProducts.slice(offset, offset + limit);

    // Performance Rule: Strip full arrays, return only counts and core data
    return paginatedProducts.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        image_count: p.image_urls.length,
        video_count: p.video_urls.length,
        created_at: p.created_at
    }));
}

function getProductById(id) {
    return products.get(id); // Returns the full product including all media URLs
}

function appendMedia(id, newImages = [], newVideos = []) {
    const product = products.get(id);
    if (!product) {
        return null; // Product not found
    }

    product.image_urls.push(...newImages);
    product.video_urls.push(...newVideos);

    return product;
}

module.exports = { createProduct, getProductsList, getProductById, appendMedia };