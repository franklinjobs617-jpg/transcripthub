import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/stripePayment.html",
        destination: "/payment/success",
      },
      {
        source: "/stripeCancel.html",
        destination: "/payment/cancel",
      },
    ];
  },
};

export default nextConfig;
