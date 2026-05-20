if (typeof process !== "undefined" && process.emitWarning) {
  const originalEmitWarning = process.emitWarning.bind(process);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors Node's emitWarning overloads
  process.emitWarning = (warning: string | Error, ...args: any[]) => {
    const message =
      typeof warning === "string" ? warning : warning.message ?? "";

    if (
      message.includes("SECURITY WARNING") &&
      message.includes("sslmode")
    ) {
      return;
    }

    return originalEmitWarning(warning, ...args);
  };
}
