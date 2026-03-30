import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://transcripthub.com";
    const lastModified = new Date();

    return [
        {
            url: `${baseUrl}`,
            lastModified,
            changeFrequency: "daily",
            priority: 1.0,
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified,
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/instagram-transcript`,
            lastModified,
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/tiktok-transcript`,
            lastModified,
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/facebook-transcript`,
            lastModified,
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified,
            changeFrequency: "monthly",
            priority: 0.3,
        },
    ];
}
