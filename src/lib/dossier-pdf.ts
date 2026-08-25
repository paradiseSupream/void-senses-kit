/**
 * Client half of the PDF export: it owns no premium text at all.
 *
 * The browser only forwards its short-lived signed token to
 * `POST /api/dossier-pdf`; the server verifies entitlement and streams the file
 * back. Nothing about the dossier can be reconstructed from this module.
 */

export async function downloadDossierPdf(pdfToken: string): Promise<void> {
  const response = await fetch("/api/dossier-pdf", {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ token: pdfToken }),
  });

  if (!response.ok) {
    throw new Error(response.status === 401 || response.status === 403 ? "locked" : "failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "senses-of-void-dossier.pdf";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
}
