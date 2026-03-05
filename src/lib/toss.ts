/**
 * Toss Mini-App Integration Layer
 *
 * Detects Toss WebView environment and provides bridge APIs.
 * When not in Toss, all functions gracefully fall back to no-ops.
 */

// --- Environment Detection ---

let _isToss: boolean | null = null;

/**
 * Detect if running inside Toss mini-app WebView.
 * Checks for Toss-specific user agent or bridge object.
 */
export function isTossApp(): boolean {
  if (typeof window === "undefined") return false;
  if (_isToss !== null) return _isToss;

  _isToss =
    /TossApp/i.test(navigator.userAgent) ||
    !!(window as any).__granite_bridge__ ||
    !!(window as any).__apps_in_toss__;

  return _isToss;
}

// --- Auth ---

/**
 * Toss OAuth login via appLogin bridge.
 * Returns authorization code to exchange server-side.
 */
export async function tossLogin(): Promise<{
  authorizationCode: string;
  referrer: string;
} | null> {
  if (!isTossApp()) return null;
  try {
    const { appLogin } = await import("@apps-in-toss/web-bridge");
    return await appLogin();
  } catch (e) {
    console.error("[Toss] appLogin failed:", e);
    return null;
  }
}

// --- Payment ---

export interface TossPaymentResult {
  success: boolean;
  reason?: string;
}

/**
 * Trigger Toss Pay checkout.
 * payToken is obtained from your server after creating a payment order.
 */
export async function tossCheckoutPayment(
  payToken: string
): Promise<TossPaymentResult> {
  if (!isTossApp()) return { success: false, reason: "not-toss-app" };
  try {
    const { checkoutPayment } = await import("@apps-in-toss/web-bridge");
    return await checkoutPayment({ payToken });
  } catch (e) {
    console.error("[Toss] checkoutPayment failed:", e);
    return { success: false, reason: String(e) };
  }
}

// --- Share ---

/**
 * Share content via Toss native share sheet.
 * Falls back to Web Share API or clipboard copy.
 */
export async function tossShare(message: string): Promise<void> {
  if (isTossApp()) {
    try {
      const { share } = await import("@apps-in-toss/web-bridge");
      await share({ message });
      return;
    } catch {
      // fall through to web share
    }
  }

  // Fallback: Web Share API
  if (navigator.share) {
    await navigator.share({ text: message });
  } else {
    await navigator.clipboard.writeText(message);
  }
}

// --- Close ---

/**
 * Close the Toss mini-app view.
 */
export async function tossCloseView(): Promise<void> {
  if (!isTossApp()) return;
  try {
    const { closeView } = await import("@apps-in-toss/web-bridge");
    await closeView();
  } catch (e) {
    console.error("[Toss] closeView failed:", e);
  }
}

// --- Clipboard ---

export async function tossSetClipboard(text: string): Promise<void> {
  if (isTossApp()) {
    try {
      const { setClipboardText } = await import("@apps-in-toss/web-bridge");
      await setClipboardText(text);
      return;
    } catch {
      // fall through
    }
  }
  await navigator.clipboard.writeText(text);
}

// --- Leaderboard ---

/**
 * Submit score to Toss Game Center leaderboard.
 * Score must be a float string (e.g. "1500").
 */
export async function tossSubmitScore(score: number): Promise<boolean> {
  if (!isTossApp()) return false;
  try {
    const { submitGameCenterLeaderBoardScore } = await import(
      "@apps-in-toss/web-bridge"
    );
    const result = await submitGameCenterLeaderBoardScore({
      score: String(score),
    });
    return result?.statusCode === "SUCCESS";
  } catch (e) {
    console.error("[Toss] submitScore failed:", e);
    return false;
  }
}

/**
 * Open Toss native leaderboard UI.
 * Falls back to no-op outside Toss.
 */
export async function tossOpenLeaderboard(): Promise<boolean> {
  if (!isTossApp()) return false;
  try {
    const { openGameCenterLeaderboard } = await import(
      "@apps-in-toss/web-bridge"
    );
    await openGameCenterLeaderboard();
    return true;
  } catch (e) {
    console.error("[Toss] openLeaderboard failed:", e);
    return false;
  }
}

// --- Haptic Feedback ---

export async function tossHaptic(
  type: "tickWeak" | "tap" | "success" | "error" = "tap"
): Promise<void> {
  if (!isTossApp()) return;
  try {
    const { generateHapticFeedback } = await import(
      "@apps-in-toss/web-bridge"
    );
    await generateHapticFeedback({ type });
  } catch {
    // silent
  }
}
