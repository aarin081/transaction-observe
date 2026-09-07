type RpcEnvelope<T> = {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
};

export class RpcError extends Error {
  constructor(message: string, public readonly causeData?: unknown) {
    super(message);
    this.name = "RpcError";
  }
}

export async function rpcCall<T>(
  url: string,
  method: string,
  params: unknown[] = [],
  attempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new RpcError(`HTTP ${response.status} from Arc RPC`);
      }

      const payload = (await response.json()) as RpcEnvelope<T>;
      if (payload.error) {
        throw new RpcError(
          `RPC ${payload.error.code}: ${payload.error.message}`,
          payload.error.data,
        );
      }
      if (payload.result === undefined) {
        throw new RpcError(`Arc RPC returned no result for ${method}`);
      }

      return payload.result;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  throw new RpcError(`Failed ${method} after ${attempts} attempts`, lastError);
}

export function hexToBigInt(value: string): bigint {
  if (!/^0x[0-9a-fA-F]+$/.test(value)) {
    throw new Error(`Invalid hex quantity: ${value}`);
  }
  return BigInt(value);
}
