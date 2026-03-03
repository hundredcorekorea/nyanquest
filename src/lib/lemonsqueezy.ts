const LS_API = "https://api.lemonsqueezy.com/v1";

function getApiKey(): string {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) throw new Error("LEMONSQUEEZY_API_KEY is not set");
  return key;
}

export async function createCheckout(opts: {
  variantId: string;
  redirectUrl: string;
  customData: Record<string, string>;
}) {
  const res = await fetch(`${LS_API}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: opts.customData,
          },
          product_options: {
            redirect_url: opts.redirectUrl,
          },
        },
        relationships: {
          store: {
            data: { type: "stores", id: process.env.LEMONSQUEEZY_STORE_ID || "300836" },
          },
          variant: {
            data: { type: "variants", id: opts.variantId },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[lemonsqueezy] Checkout creation failed:", res.status, errText);
    throw new Error(`Lemon Squeezy error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  return json.data.attributes.url as string;
}

export async function getOrder(orderId: string) {
  const res = await fetch(`${LS_API}/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      Accept: "application/vnd.api+json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to get order: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

export async function refundOrder(orderId: string) {
  const res = await fetch(`${LS_API}/orders/${orderId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      Accept: "application/vnd.api+json",
    },
  });

  if (!res.ok) {
    throw new Error(`Refund failed: ${res.status}`);
  }

  return await res.json();
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  // Lemon Squeezy uses HMAC-SHA256
  const crypto = require("crypto") as typeof import("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
