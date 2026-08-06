import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

import type { ClaimChartExportSnapshot } from "@/lib/export/types";

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${Math.round(value * 100)}%`;
}

function formatTimestamp(date: Date): string {
  try {
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return date.toISOString();
  }
}

function heading(text: string, level = HeadingLevel.HEADING_1): Paragraph {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 240, after: 120 },
  });
}

function labelValue(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value || "—" }),
    ],
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: text || "—" })],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    indent: { left: 360 },
    children: [new TextRun({ text: `• ${text}` })],
  });
}

/**
 * Build a Word document from the current claim-chart export snapshot.
 */
export function buildClaimChartDocument(
  snapshot: ClaimChartExportSnapshot
): Document {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: "Patent Claim Chart",
          bold: true,
          size: 36,
        }),
      ],
    }),
    labelValue("Patent", snapshot.patentTitle),
    labelValue("Generated", formatTimestamp(snapshot.generatedAt)),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
  ];

  for (const element of snapshot.elements) {
    children.push(heading(`Claim Element ${element.id}`, HeadingLevel.HEADING_1));
    children.push(labelValue("Claim Element ID", element.id));
    children.push(labelValue("Original claim text", element.originalClaimText));
    children.push(labelValue("Review status", element.reviewStatus));
    children.push(labelValue("Current reasoning", element.reasoning));
    children.push(
      labelValue("Overall confidence", formatPercent(element.overallConfidence))
    );
    children.push(
      labelValue(
        "Supporting document count",
        String(element.supportingDocumentCount)
      )
    );

    children.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [new TextRun({ text: "Supporting documents", bold: true })],
      })
    );
    if (element.supportingDocuments.length === 0) {
      children.push(bodyParagraph("None"));
    } else {
      for (const doc of element.supportingDocuments) {
        children.push(bullet(doc));
      }
    }

    children.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [new TextRun({ text: "Evidence snippets", bold: true })],
      })
    );
    if (element.evidenceSnippets.length === 0) {
      children.push(bodyParagraph("None"));
    } else {
      for (const snippet of element.evidenceSnippets) {
        children.push(bullet(snippet));
      }
    }

    children.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [new TextRun({ text: "Evidence citations", bold: true })],
      })
    );
    if (element.evidenceCitations.length === 0) {
      children.push(bodyParagraph("None"));
    } else {
      for (const citation of element.evidenceCitations) {
        children.push(bullet(citation));
      }
    }

    children.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({ text: "AI refinement history", bold: true }),
        ],
      })
    );
    if (!element.acceptedRefinement) {
      children.push(bodyParagraph("No accepted refinement for this claim."));
    } else {
      const refinement = element.acceptedRefinement;
      children.push(
        labelValue("Latest accepted version", `Version ${refinement.version}`)
      );
      children.push(labelValue("Title", refinement.title));
      children.push(labelValue("Accepted reasoning", refinement.reasoning));
      children.push(
        labelValue("Confidence", formatPercent(refinement.confidence))
      );
      children.push(labelValue("Primary source", refinement.primarySource));
      children.push(labelValue("Citation", refinement.citation));
    }
  }

  const { summary } = snapshot;
  children.push(heading("Summary", HeadingLevel.HEADING_1));
  children.push(
    labelValue("Total claim elements", String(summary.totalClaimElements))
  );
  children.push(labelValue("Accepted", String(summary.accepted)));
  children.push(labelValue("Rejected", String(summary.rejected)));
  children.push(labelValue("Pending", String(summary.pending)));
  children.push(labelValue("Needs Review", String(summary.needsReview)));
  children.push(
    labelValue("Average confidence", formatPercent(summary.averageConfidence))
  );

  return new Document({
    creator: "iLumos",
    title: `Patent Claim Chart — ${snapshot.patentTitle}`,
    description: "Exported claim chart from iLumos workspace",
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

/** Serialize snapshot to a browser Blob for download. */
export async function buildClaimChartDocxBlob(
  snapshot: ClaimChartExportSnapshot
): Promise<Blob> {
  const document = buildClaimChartDocument(snapshot);
  return Packer.toBlob(document);
}

/** Serialize snapshot to a Buffer (Node / validation scripts). */
export async function buildClaimChartDocxBuffer(
  snapshot: ClaimChartExportSnapshot
): Promise<Buffer> {
  const document = buildClaimChartDocument(snapshot);
  return Packer.toBuffer(document);
}
