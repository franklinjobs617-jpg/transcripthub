import { MetadataRoute } from "next";
import { getAbsoluteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();
    const pages: Array<{
        path: string;
        changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
        priority: number;
    }> = [
        { path: "/", changeFrequency: "daily", priority: 1.0 },
        { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
        { path: "/instagram-transcript", changeFrequency: "daily", priority: 0.9 },
        { path: "/tiktok-transcript", changeFrequency: "daily", priority: 0.9 },
        { path: "/facebook-transcript", changeFrequency: "daily", priority: 0.9 },
        { path: "/free-instagram-transcript", changeFrequency: "weekly", priority: 0.75 },
        { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
        { path: "/terms", changeFrequency: "monthly", priority: 0.4 },
        { path: "/privacy", changeFrequency: "monthly", priority: 0.4 },
        { path: "/cookies", changeFrequency: "monthly", priority: 0.3 },
    ];

    return pages.map((page) => ({
        url: getAbsoluteUrl(page.path),
        lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
    }));
}
