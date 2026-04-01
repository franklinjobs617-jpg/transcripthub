import { MetadataRoute } from "next";
import { getAbsoluteUrl, getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
    return {
        host: getSiteUrl(),
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/admin/"],
        },
        sitemap: getAbsoluteUrl("/sitemap.xml"),
    };
}
