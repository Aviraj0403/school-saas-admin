/** Loads Razorpay Checkout on demand (no npm package). */
const SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export function loadRazorpay(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve(true));
    script.addEventListener('error', () => resolve(false));
    if (!existing) {
      script.src = SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

export function openRazorpay(options: Record<string, any>): {
  open: () => void;
  on: (e: string, cb: (r: any) => void) => void;
} {
  return new (window as any).Razorpay(options);
}
