const MERCADOPAGO_API_URL = "https://api.mercadopago.com";

export type ProductoMercadoPago = "7_dias" | "pro";

export function obtenerUrlBase(): string {
  const rawUrl =
    process.env.CONTEXT === "deploy-preview" && process.env.DEPLOY_PRIME_URL
      ? process.env.DEPLOY_PRIME_URL
      : process.env.NEXT_PUBLIC_URL || "http://localhost:8889";
  return /^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
}

export function crearReferenciaExterna(
  producto: ProductoMercadoPago,
  userId: string
): string {
  return `vitalis:${producto}:${userId}`;
}

export function leerReferenciaExterna(
  referencia: string | null | undefined
): { producto: ProductoMercadoPago; userId: string } | null {
  if (!referencia) return null;
  const [marca, producto, userId] = referencia.split(":");
  if (
    marca !== "vitalis" ||
    (producto !== "7_dias" && producto !== "pro") ||
    !userId
  ) {
    return null;
  }
  return { producto, userId };
}

export async function mercadoPagoRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN no está configurado.");
  }

  const response = await fetch(`${MERCADOPAGO_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago respondió con estado ${response.status}.`);
  }

  return response.json() as Promise<T>;
}
