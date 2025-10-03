export function extractText(resp: unknown): string {
  if (resp && typeof resp === "object") {
    const obj = resp as Record<string, unknown>;
    const ot = obj["output_text"];
    if (typeof ot === "string") return ot;
    const content = obj["content"];
    if (Array.isArray(content) && content.length > 0) {
      const first = content[0] as Record<string, unknown>;
      const t = first?.["text"];
      if (typeof t === "string") return t;
    }
  }
  return "";
}

