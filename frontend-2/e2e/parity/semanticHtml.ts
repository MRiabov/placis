import type { Page } from "@playwright/test";

export type SemanticNode = {
  tag: string;
  text?: string;
  attrs?: Record<string, string>;
  children?: SemanticNode[];
};

/** Extracts the semantic DOM from the live page: tag hierarchy + text +
 *  structural attributes, dropping cosmetics and React internals. Pass a
 *  CSS selector to scope the extraction to a subtree (e.g. the ported
 *  content region of a view that gained new chrome). */
export async function extractSemanticHtml(
  page: Page,
  selector?: string,
): Promise<SemanticNode[]> {
  return page.evaluate(
    ({ rootSelector }) => {
      const skippedTags = new Set<string>([
        "SCRIPT",
        "STYLE",
        "NOSCRIPT",
        "TEMPLATE",
        "SVG",
        "PATH",
        "RECT",
        "CIRCLE",
      ]);
      const skippedAttrs = new Set([
        "class",
        "style",
        "id",
        "data-reactroot",
        "data-sentry-component",
      ]);
      const keptAttrs = [
        "href",
        "src",
        "alt",
        "title",
        "role",
        "aria-label",
        "aria-expanded",
        "aria-selected",
        "aria-checked",
        "aria-current",
        "aria-live",
        "aria-describedby",
        "type",
        "placeholder",
        "value",
        "checked",
        "disabled",
        "name",
        "for",
        "selected",
      ];

      function normalizeText(value: string): string {
        return value.replace(/\s+/g, " ").trim();
      }

      function elementAttrs(element: Element): Record<string, string> {
        const attrs: Record<string, string> = {};
        for (const name of keptAttrs) {
          const value = element.getAttribute(name);
          if (value !== null && !skippedAttrs.has(name)) {
            attrs[name] = value;
          }
        }
        return attrs;
      }

      function semanticChildren(
        element: Element,
        depth: number,
      ): { children: unknown[]; text: string } {
        const children: unknown[] = [];
        const textParts: string[] = [];
        for (const child of element.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            textParts.push(child.textContent ?? "");
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childSemantic = nodeToSemantic(child as Element, depth + 1);
            if (childSemantic) {
              children.push(childSemantic);
            }
          }
        }
        return { children, text: normalizeText(textParts.join(" ")) };
      }

      function nodeToSemantic(
        element: Element,
        depth: number,
      ): { tag: string; text?: string; attrs?: Record<string, string>; children?: unknown[] } | null {
        const tag = element.tagName.toLowerCase();
        if (skippedTags.has(element.tagName) || depth > 40) {
          return null;
        }
        const attrs = elementAttrs(element);
        const { children, text } = semanticChildren(element, depth);
        const semantic = {
          tag,
          ...(Object.keys(attrs).length ? { attrs } : {}),
          ...(text ? { text } : {}),
          ...(children.length ? { children } : {}),
        };
        if (!Object.keys(attrs).length && !text && !children.length) {
          return null;
        }
        return semantic;
      }

      const root = rootSelector
        ? (document.querySelector(rootSelector) as Element | null)
        : document.body;
      if (!root) {
        return [];
      }
      return Array.from(root.childNodes)
        .map((child) =>
          child.nodeType === Node.ELEMENT_NODE
            ? nodeToSemantic(child as Element, 0)
            : null,
        )
        .filter(Boolean);
    },
    { rootSelector: selector },
  );
}

/** Structural diff between the old app's semantic tree and the port's. */
export function diffSemanticHtml(
  expected: SemanticNode[],
  actual: SemanticNode[],
  path = "root",
): string[] {
  const differences: string[] = [];
  const maxLength = Math.max(expected.length, actual.length);
  for (let index = 0; index < maxLength; index += 1) {
    const expectedNode = expected[index];
    const actualNode = actual[index];
    if (!expectedNode) {
      differences.push(`${path}[${index}]: port has extra <${actualNode?.tag ?? "?"}>`);
      continue;
    }
    if (!actualNode) {
      differences.push(`${path}[${index}]: port missing <${expectedNode.tag}> (old app)`);
      continue;
    }
    if (expectedNode.tag !== actualNode.tag) {
      differences.push(
        `${path}[${index}]: tag <${expectedNode.tag}> (old) != <${actualNode.tag}> (port)`,
      );
      continue;
    }
    if ((expectedNode.text ?? "") !== (actualNode.text ?? "")) {
      differences.push(
        `${path}[${index}] <${expectedNode.tag}>: text "${expectedNode.text ?? ""}" (old) != "${actualNode.text ?? ""}" (port)`,
      );
    }
    const expectedAttrs = JSON.stringify(
      comparableAttrs(expectedNode),
    );
    const actualAttrs = JSON.stringify(comparableAttrs(actualNode));
    if (expectedAttrs !== actualAttrs) {
      differences.push(
        `${path}[${index}] <${expectedNode.tag}>: attrs ${expectedAttrs} != ${actualAttrs}`,
      );
    }
    differences.push(
      ...diffSemanticHtml(
        expectedNode.children ?? [],
        actualNode.children ?? [],
        `${path}[${index}]/${expectedNode.tag}`,
      ),
    );
  }
  return differences;
}

/** The old app's markup carries a11y debt the port's stricter lint forbids
 *  (implicit combobox inputs, aria-label on bare divs). The port writes the
 *  cleaned-up form; treat both as semantically equal. */
function comparableAttrs(node: SemanticNode): Record<string, string> {
  const attrs = { ...node.attrs };
  if (node.tag === "input" && attrs.role === "combobox") {
    delete attrs.role;
  }
  if (node.tag === "div" && attrs.role === undefined) {
    delete attrs["aria-label"];
  }
  return attrs;
}
