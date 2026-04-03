import * as cheerio from "cheerio";
import type { Element as DomElement, AnyNode } from "domhandler";

export function htmlToReadableMarkdown(html: string, url: string): string {
  const $ = cheerio.load(html);

  // Remove noise
  $(
    "script, style, nav, footer, header, iframe, noscript, svg, form"
  ).remove();
  $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();
  $(".sidebar, .nav, .footer, .header, .menu, .ad, .ads, .cookie").remove();

  // Try to find main content
  const mainSelectors = [
    "article",
    "main",
    '[role="main"]',
    ".post-content",
    ".article-content",
    ".entry-content",
    ".content",
    "#content",
    ".readme",
  ];

  let contentEl: cheerio.Cheerio<AnyNode> | null = null;
  for (const sel of mainSelectors) {
    const el = $(sel).first();
    if (el.length && (el.text() || "").trim().length > 100) {
      contentEl = el;
      break;
    }
  }

  const root = contentEl || $("body");
  const title = $("title").text().trim();
  const metaDesc = $('meta[name="description"]').attr("content")?.trim();

  let md = "";
  if (title) md += `# ${title}\n\n`;
  if (metaDesc) md += `> ${metaDesc}\n\n`;
  md += `Source: ${url}\n\n---\n\n`;

  md += elementToMarkdown($, root);

  // Trim excessive whitespace
  md = md.replace(/\n{4,}/g, "\n\n\n").trim();

  // Cap at ~50k chars
  if (md.length > 50000) {
    md =
      md.slice(0, 50000) +
      "\n\n[... content truncated at 50,000 characters ...]";
  }

  return md;
}

function elementToMarkdown(
  $: cheerio.CheerioAPI,
  el: cheerio.Cheerio<AnyNode>
): string {
  let result = "";

  el.contents().each((_, node) => {
    if (node.type === "text") {
      result += (node as unknown as { data: string }).data || "";
      return;
    }
    if (node.type !== "tag") return;

    const tagEl = $(node);
    const tag = (node as DomElement).tagName?.toLowerCase();
    if (!tag) return;

    switch (tag) {
      case "h1":
        result += `\n\n# ${tagEl.text().trim()}\n\n`;
        break;
      case "h2":
        result += `\n\n## ${tagEl.text().trim()}\n\n`;
        break;
      case "h3":
        result += `\n\n### ${tagEl.text().trim()}\n\n`;
        break;
      case "h4":
      case "h5":
      case "h6":
        result += `\n\n#### ${tagEl.text().trim()}\n\n`;
        break;
      case "p":
        result += `\n\n${tagEl.text().trim()}\n\n`;
        break;
      case "br":
        result += "\n";
        break;
      case "a": {
        const href = tagEl.attr("href");
        const text = tagEl.text().trim();
        if (href && text) {
          result += `[${text}](${href})`;
        } else if (text) {
          result += text;
        }
        break;
      }
      case "img": {
        const alt = tagEl.attr("alt") || "image";
        const src = tagEl.attr("src");
        if (src) result += `![${alt}](${src})`;
        break;
      }
      case "code":
        result += `\`${tagEl.text()}\``;
        break;
      case "pre":
        result += `\n\n\`\`\`\n${tagEl.text().trim()}\n\`\`\`\n\n`;
        break;
      case "ul":
      case "ol":
        tagEl.children("li").each((i, li) => {
          const prefix = tag === "ol" ? `${i + 1}. ` : "- ";
          result += `\n${prefix}${$(li).text().trim()}`;
        });
        result += "\n\n";
        break;
      case "blockquote":
        result += `\n\n> ${tagEl.text().trim()}\n\n`;
        break;
      case "strong":
      case "b":
        result += `**${tagEl.text().trim()}**`;
        break;
      case "em":
      case "i":
        result += `*${tagEl.text().trim()}*`;
        break;
      default:
        result += elementToMarkdown($, tagEl);
    }
  });

  return result;
}
