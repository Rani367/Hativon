interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  children?: HastNode[];
}

function isBlankText(node: HastNode): boolean {
  return node.type === "text" && !node.value?.trim();
}

function isLoneImageParagraph(node: HastNode): boolean {
  if (node.type !== "element" || node.tagName !== "p") return false;

  const content = (node.children ?? []).filter((child) => !isBlankText(child));
  return content.length === 1 && content[0].tagName === "img";
}

/**
 * Lifts images out of their paragraphs. Markdown wraps a lone image in <p>, and
 * the <figure> it renders as isn't allowed inside <p>, which is invalid HTML that
 * browsers quietly restructure.
 */
export function rehypeUnwrapImages() {
  function visit(node: HastNode) {
    node.children = node.children?.map((child) => {
      if (!isLoneImageParagraph(child)) {
        visit(child);
        return child;
      }
      return child.children!.find((inner) => !isBlankText(inner))!;
    });
  }

  return visit;
}
