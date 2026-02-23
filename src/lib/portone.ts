export async function verifyPayment(paymentId: string) {
  const response = await fetch(
    `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `PortOne ${process.env.PORTONE_API_SECRET?.trim()}`,
      },
    }
  );
  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Portone API error ${response.status}: ${errText}`);
  }
  return response.json();
}
