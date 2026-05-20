// server.js
const express = require('express');
const { createProduct, getProductsList, getProductById, appendMedia } = require('./catalog');

const app = express();
app.use(express.json());

// Helper function to validate URLs (must be http:// or https://)
const isValidUrl = (url) => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (err) {
        return false;
    }
};

// 1. POST /products (Create a product)
app.post('/products', (req, res) => {
    const { name, sku, image_urls = [], video_urls = [] } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: "Name is required and must be a non-empty string" });
    }
    if (!sku || typeof sku !== 'string' || sku.trim() === '') {
        return res.status(400).json({ error: "SKU is required and must be a non-empty string" });
    }
    if (!Array.isArray(image_urls) || image_urls.length > 20) {
        return res.status(400).json({ error: "image_urls must be an array with max 20 items" });
    }
    if (!Array.isArray(video_urls) || video_urls.length > 20) {
        return res.status(400).json({ error: "video_urls must be an array with max 20 items" });
    }
    
    // Validate individual URLs and length constraints
    const allUrls = [...image_urls, ...video_urls];
    for (const url of allUrls) {
        if (!isValidUrl(url) || url.length > 2048) {
            return res.status(400).json({ error: `Invalid URL provided (must be http/https and < 2048 chars): ${url}` });
        }
    }

    const result = createProduct({ name, sku, image_urls, video_urls });

    if (result.error === "duplicate_sku") {
        return res.status(409).json({ error: "Product with this SKU already exists" });
    }

    return res.status(201).json(result);
});

// 2. GET /products (List view with pagination)
app.get('/products', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const list = getProductsList(limit, offset);
    return res.json({ limit, offset, count: list.length, data: list });
});

// 3. GET /products/{id} (Detail view)
app.get('/products/:id', (req, res) => {
    const product = getProductById(req.params.id);
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }
    return res.json(product);
});

// 4. POST /products/{id}/media (Append media)
app.post('/products/:id/media', (req, res) => {
    const { image_urls = [], video_urls = [] } = req.body;

    if (image_urls.length === 0 && video_urls.length === 0) {
        return res.status(400).json({ error: "At least one of image_urls or video_urls is required" });
    }
    if (!Array.isArray(image_urls) || image_urls.length > 20 || !Array.isArray(video_urls) || video_urls.length > 20) {
        return res.status(400).json({ error: "URL arrays must not exceed 20 items per request" });
    }

    // Validate individual URLs and lengths
    const allUrls = [...image_urls, ...video_urls];
    for (const url of allUrls) {
        if (!isValidUrl(url) || url.length > 2048) {
            return res.status(400).json({ error: `Invalid URL provided: ${url}` });
        }
    }

    const updatedProduct = appendMedia(req.params.id, image_urls, video_urls);
    if (!updatedProduct) {
        return res.status(404).json({ error: "Product not found" });
    }

    return res.json(updatedProduct);
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Part 2 Product Catalog running on port ${PORT}`);
});