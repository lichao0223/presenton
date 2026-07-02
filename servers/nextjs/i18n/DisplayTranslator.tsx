"use client";

import { useEffect } from "react";
import { useI18n } from "./I18nProvider";

const SKIP_SELECTOR = [
  "[data-i18n-skip]",
  "[contenteditable='true']",
  "input",
  "textarea",
  "select",
  "code",
  "pre",
  "#presentation-slides-wrapper .main-slide",
  ".slide-theme [data-layout]",
  "[data-layout]",
].join(",");

const ATTRIBUTE_SKIP_SELECTOR = [
  "[data-i18n-skip]",
  "[contenteditable='true']",
  "code",
  "pre",
  "#presentation-slides-wrapper .main-slide",
  ".slide-theme [data-layout]",
  "[data-layout]",
].join(",");

const TRANSLATED_ATTR_PREFIX = "data-i18n-original-";
const TRANSLATED_ATTR_VALUE_PREFIX = "data-i18n-translated-";
const TRANSLATABLE_ATTRIBUTES = ["placeholder", "title", "aria-label"] as const;
const originalTextNodes = new WeakMap<
  Text,
  { original: string; translated: string | null }
>();

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function shouldSkipNode(node: Node) {
  const parent =
    node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
  return !!parent?.closest(SKIP_SELECTOR);
}

function translateTextNodes(root: ParentNode, translate: (text: string) => string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent || !normalizeText(node.textContent)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (shouldSkipNode(node)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  nodes.forEach((node) => {
    const currentText = node.textContent ?? "";
    const stored = originalTextNodes.get(node);

    if (
      !stored ||
      (currentText !== stored.original && currentText !== stored.translated)
    ) {
      originalTextNodes.set(node, {
        original: currentText,
        translated: null,
      });
    }

    const record = originalTextNodes.get(node);
    const original = record?.original ?? "";
    const translated = translate(normalizeText(original));
    if (translated === normalizeText(original)) return;

    const leading = original.match(/^\s*/)?.[0] ?? "";
    const trailing = original.match(/\s*$/)?.[0] ?? "";
    const translatedText = `${leading}${translated}${trailing}`;
    if (record) {
      record.translated = translatedText;
    }
    node.textContent = translatedText;
  });
}

function translateAttributes(root: ParentNode, translate: (text: string) => string) {
  TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
    const elements = root.querySelectorAll<HTMLElement>(`[${attribute}]`);

    elements.forEach((element) => {
      if (element.closest(ATTRIBUTE_SKIP_SELECTOR)) return;

      const originalAttribute = `${TRANSLATED_ATTR_PREFIX}${attribute}`;
      const translatedAttribute = `${TRANSLATED_ATTR_VALUE_PREFIX}${attribute}`;
      const current = element.getAttribute(attribute) ?? "";
      const original = element.getAttribute(originalAttribute);
      const translatedValue = element.getAttribute(translatedAttribute);

      if (
        original === null ||
        (current !== original && current !== translatedValue)
      ) {
        element.setAttribute(originalAttribute, current);
        element.removeAttribute(translatedAttribute);
      }

      const nextOriginal = element.getAttribute(originalAttribute) ?? "";
      const translated = translate(normalizeText(nextOriginal));
      if (translated !== normalizeText(nextOriginal)) {
        element.setAttribute(translatedAttribute, translated);
        element.setAttribute(attribute, translated);
      }
    });
  });
}

function restoreOriginals(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  textNodes.forEach((node) => {
    const record = originalTextNodes.get(node);
    if (!record) return;

    const currentText = node.textContent ?? "";
    if (record.translated !== null && currentText === record.translated) {
      node.textContent = record.original;
      record.translated = null;
      return;
    }

    if (currentText !== record.original) {
      record.original = currentText;
      record.translated = null;
    }
  });

  TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
    const originalAttribute = `${TRANSLATED_ATTR_PREFIX}${attribute}`;
    const translatedAttribute = `${TRANSLATED_ATTR_VALUE_PREFIX}${attribute}`;
    root.querySelectorAll<HTMLElement>(`[${originalAttribute}]`).forEach((element) => {
      const original = element.getAttribute(originalAttribute);
      const translated = element.getAttribute(translatedAttribute);
      const current = element.getAttribute(attribute) ?? "";
      if (original !== null) {
        if (translated !== null && current === translated) {
          element.setAttribute(attribute, original);
        } else if (current !== original) {
          element.setAttribute(originalAttribute, current);
        }
      }
      element.removeAttribute(originalAttribute);
      element.removeAttribute(translatedAttribute);
    });
  });
}

export function DisplayTranslator() {
  const { locale, t } = useI18n();

  useEffect(() => {
    let isTranslating = false;
    let scheduledFrame: number | null = null;

    const translatePage = () => {
      isTranslating = true;
      restoreOriginals(document.body);
      if (locale !== "en") {
        translateTextNodes(document.body, t);
        translateAttributes(document.body, t);
      }
      window.setTimeout(() => {
        isTranslating = false;
      }, 0);
    };

    const scheduleTranslate = () => {
      if (isTranslating || scheduledFrame !== null) return;
      scheduledFrame = window.requestAnimationFrame(() => {
        scheduledFrame = null;
        translatePage();
      });
    };

    translatePage();

    const observer = new MutationObserver(scheduleTranslate);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
    });

    return () => {
      observer.disconnect();
      if (scheduledFrame !== null) {
        window.cancelAnimationFrame(scheduledFrame);
      }
    };
  }, [locale, t]);

  return null;
}
