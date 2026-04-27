type ErrorDetails = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function normalizeError(error: unknown): ErrorDetails {
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
    };
  }

  if (error && typeof error === "object") {
    const maybeError = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };

    return {
      message:
        typeof maybeError.message === "string" && maybeError.message.length > 0
          ? maybeError.message
          : "Unknown error",
      code: typeof maybeError.code === "string" ? maybeError.code : undefined,
      details: typeof maybeError.details === "string" ? maybeError.details : undefined,
      hint: typeof maybeError.hint === "string" ? maybeError.hint : undefined,
    };
  }

  return {
    message: "Unknown error",
  };
}

export function getErrorMessage(error: unknown) {
  return normalizeError(error).message;
}
