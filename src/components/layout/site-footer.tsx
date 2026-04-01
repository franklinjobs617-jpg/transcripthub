"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MessageSquare } from "lucide-react";

export function SiteFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-app-border bg-app-surface pt-16 pb-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">

                    {/* Column 1: Brand & SEO Pitch */}
                    <div className="col-span-2 lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2.5 mb-6">
                            <Image
                                src="/icon.png?v=20260401b"
                                alt="Transcripthub logo"
                                width={40}
                                height={40}
                                unoptimized
                                className="h-10 w-10 object-contain"
                            />
                            <span className="font-bold text-xl tracking-tight">Transcripthub</span>
                        </Link>
                        <p className="text-sm text-app-text-muted leading-relaxed max-w-sm mb-6">
                            High-accuracy AI transcription tool specifically optimized for
                            Instagram Reels, TikToks, and Facebook Shorts. Turn video content
                            into text in seconds.
                        </p>
                        <div className="flex items-center gap-4 text-app-text-muted">
                            <Link href="/contact" className="hover:text-app-text transition-colors">
                                <Mail className="h-5 w-5" />
                            </Link>
                            <Link href="/#faq" className="hover:text-app-text transition-colors">
                                <MessageSquare className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Column 2: Tools (Hubs) */}
                    <div>
                        <h4 className="font-bold text-sm mb-6 uppercase tracking-widest text-app-text">Tools</h4>
                        <ul className="space-y-4 text-sm font-medium text-app-text-muted">
                            <li>
                                <Link href="/instagram-transcript" className="hover:text-app-text transition-colors">
                                    Instagram Transcript
                                </Link>
                            </li>
                            <li>
                                <Link href="/tiktok-transcript" className="hover:text-app-text transition-colors">
                                    TikTok Transcript
                                </Link>
                            </li>
                            <li>
                                <Link href="/facebook-transcript" className="hover:text-app-text transition-colors">
                                    Facebook Transcript
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Resources */}
                    <div>
                        <h4 className="font-bold text-sm mb-6 uppercase tracking-widest text-app-text">Resources</h4>
                        <ul className="space-y-4 text-sm font-medium text-app-text-muted">
                            <li>
                                <Link href="/pricing" className="hover:text-app-text transition-colors">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/#faq" className="hover:text-app-text transition-colors">
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-app-text transition-colors">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Legal */}
                    <div>
                        <h4 className="font-bold text-sm mb-6 uppercase tracking-widest text-app-text">Legal</h4>
                        <ul className="space-y-4 text-sm font-medium text-app-text-muted">
                            <li>
                                <Link href="/privacy" className="hover:text-app-text transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-app-text transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/cookies" className="hover:text-app-text transition-colors">
                                    Cookie Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="pt-12 border-t border-app-border flex flex-col items-center">
                    <div className="text-xs text-app-text-muted/40 font-medium">
                        © {currentYear} Transcripthub Inc. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}
