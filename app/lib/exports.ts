import type { AnalysisResult } from "@/src/lib/types";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportMarkdown(data: AnalysisResult) {
  const content = [
    data.tweetMarkdown,
    "---\n",
    data.buildBrief,
    "---\n",
    data.claudePrompt,
  ].join("\n");
  download(new Blob([content], { type: "text/markdown" }), "tweetpack.md");
}

export function exportJSON(data: AnalysisResult) {
  const payload = {
    tweet: data.tweet,
    signal: data.signal,
    links: data.links,
    sources: data.sources.map((s) => ({
      filename: s.filename,
      length: s.content.length,
    })),
  };
  download(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    "tweetpack.json"
  );
}

export async function exportPDF(data: AnalysisResult) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  function addText(text: string, fontSize = 11) {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, pageWidth) as string[];
    for (const line of lines) {
      if (y > 275) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += fontSize * 0.5;
    }
    y += 4;
  }

  addText("tweetpack — Build Brief", 18);
  addText(`Tweet: ${data.tweet.canonicalUrl}`, 10);
  addText(
    `Author: ${data.tweet.author || "Unknown"} (@${data.tweet.handle || "unknown"})`,
    10
  );
  addText(
    `Signal: ${data.signal.score}/100 (${data.signal.level})`,
    10
  );
  y += 6;

  if (data.tweet.text) {
    addText("Tweet Text:", 13);
    addText(data.tweet.text);
    y += 4;
  }

  addText("Build Brief:", 13);
  // Strip markdown formatting for PDF
  const plainBrief = data.buildBrief
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/^-\s/gm, "• ");
  addText(plainBrief, 10);

  doc.save("tweetpack.pdf");
}

export async function exportDOCX(data: AnalysisResult) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
  } = await import("docx");

  const children: InstanceType<typeof Paragraph>[] = [];

  children.push(
    new Paragraph({
      text: "tweetpack — Build Brief",
      heading: HeadingLevel.HEADING_1,
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Tweet: ", bold: true }),
        new TextRun(data.tweet.canonicalUrl),
      ],
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Author: ", bold: true }),
        new TextRun(
          `${data.tweet.author || "Unknown"} (@${data.tweet.handle || "unknown"})`
        ),
      ],
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Signal: ", bold: true }),
        new TextRun(`${data.signal.score}/100 (${data.signal.level})`),
      ],
    })
  );
  children.push(new Paragraph({ text: "" }));

  if (data.tweet.text) {
    children.push(
      new Paragraph({
        text: "Tweet Text",
        heading: HeadingLevel.HEADING_2,
      })
    );
    children.push(new Paragraph({ text: data.tweet.text }));
    children.push(new Paragraph({ text: "" }));
  }

  // Add build brief as paragraphs
  children.push(
    new Paragraph({
      text: "Build Brief",
      heading: HeadingLevel.HEADING_2,
    })
  );
  for (const line of data.buildBrief.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      children.push(new Paragraph({ text: "" }));
    } else if (trimmed.startsWith("# ")) {
      children.push(
        new Paragraph({
          text: trimmed.replace(/^#+\s*/, ""),
          heading: HeadingLevel.HEADING_2,
        })
      );
    } else if (trimmed.startsWith("## ")) {
      children.push(
        new Paragraph({
          text: trimmed.replace(/^#+\s*/, ""),
          heading: HeadingLevel.HEADING_3,
        })
      );
    } else {
      children.push(new Paragraph({ text: trimmed }));
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const buffer = await Packer.toBlob(doc);
  download(buffer, "tweetpack.docx");
}

export async function exportLLMPack(data: AnalysisResult) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  zip.file("tweet.json", JSON.stringify(data.tweet, null, 2));
  zip.file("tweet.md", data.tweetMarkdown);
  zip.file("build-brief.md", data.buildBrief);
  zip.file("claude-prompt.md", data.claudePrompt);
  zip.file("extracted-links.json", JSON.stringify(data.links, null, 2));

  if (data.sources.length > 0) {
    const sourcesFolder = zip.folder("sources")!;
    for (const source of data.sources) {
      sourcesFolder.file(source.filename, source.content);
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const handle = data.tweet.handle || "unknown";
  download(blob, `tweetpack_${handle}.zip`);
}
