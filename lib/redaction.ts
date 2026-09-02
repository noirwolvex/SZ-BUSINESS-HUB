export type DetectionCategory =
  | 'email'
  | 'phone'
  | 'id'
  | 'creditCard'
  | 'iban'
  | 'url'
  | 'ip'
  | 'ssn'
  | 'dob'
  | 'name';

export interface Detection {
  category: DetectionCategory;
  page: number;

  /** PDF.js text-content transform: [a, b, c, d, e, f] */
  transform: number[];

  /** Full width of the text item from PDF.js */
  itemWidth: number;

  /** Full text of the item */
  itemText: string;

  /** Start offset of the match within itemText */
  matchStart: number;

  /** Length of the matched text */
  matchLength: number;

  height: number;

  text: string;

  /** Confidence 0-1 (used for sorting/filtering) */
  confidence: number;
}

export interface RedactionRegion {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  category: DetectionCategory;
  text: string;
}

export const DETECTION_PATTERNS: Record<
  DetectionCategory,
  { label: string; pattern: RegExp; description: string }
> = {
  email: {
    label: 'Emails',
    description: 'Email addresses',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  },

  phone: {
    label: 'Phone numbers',
    description: 'International and local phone numbers',
    pattern:
      /(?<!\d)(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{2,4}(?!\d)/g,
  },

  id: {
    label: 'IDs',
    description: 'National IDs, passport, license numbers',
    pattern:
      /\b(?:[A-Z]{1,4}[-]?\d{4,10}|(?:SSN|ID|PASSPORT|LICENSE|Iqama|National|Hukomi|Numéro)[\s:]*#?\s*[A-Z0-9]{4,12})\b/gi,
  },

  creditCard: {
    label: 'Credit cards',
    description: 'Visa, Mastercard, Amex card numbers',
    pattern:
      /\b(?:4\d{3}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}|5[1-5]\d{2}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}|3[47]\d{2}[\s-]?\d{6}[\s-]?\d{5}|6(?:011|5\d{2})[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g,
  },

  iban: {
    label: 'IBAN',
    description: 'International bank account numbers',
    pattern: /\b[A-Z]{2}\d{2}[\s-]?(?:\d{4}[\s-]?){3,7}\d{1,4}\b/g,
  },

  url: {
    label: 'URLs',
    description: 'Web addresses and links',
    pattern: /https?:\/\/[^\s<>"')\]]{4,}/gi,
  },

  ip: {
    label: 'IP addresses',
    description: 'IPv4 network addresses',
    pattern:
      /\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/g,
  },

  ssn: {
    label: 'SSN',
    description: 'US Social Security numbers',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
  },

  dob: {
    label: 'Dates of birth',
    description: 'Date patterns (DOB)',
    pattern:
      /\b(?:DOB|Date of Birth|Born)\s*[:\]\)]\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\b/gi,
  },

  name: {
    label: 'Names (labeled)',
    description: 'Labeled personal names',
    pattern:
      /\b(?:Name|Full Name|Nom|First Name|Last Name)\s*[:\]\)]\s*[A-ZÀ-Ý][a-zà-ÿ]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+){1,3}/g,
  },
};

/**
 * All available detection categories.
 *
 * Used by the UI to render filters and initialize category state.
 */
export const ALL_CATEGORIES = Object.keys(
  DETECTION_PATTERNS,
) as DetectionCategory[];


/**
 * Create independent RegExp instances.
 *
 * This is important because the patterns use the `g` flag and therefore
 * maintain a mutable `lastIndex`.
 */
const COMPILED_PATTERNS: Record<DetectionCategory, RegExp> =
  Object.fromEntries(
    Object.entries(DETECTION_PATTERNS).map(([key, val]) => [
      key,
      new RegExp(val.pattern.source, val.pattern.flags),
    ]),
  ) as Record<DetectionCategory, RegExp>;


interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
}


interface PdfjsTextContent {
  items: TextItem[];
}


interface RawMatch {
  category: DetectionCategory;
  text: string;
  start: number;
  length: number;
  confidence: number;
}


/**
 * Luhn checksum validation for credit card numbers.
 */
function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let dbl = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);

    if (dbl) {
      d *= 2;

      if (d > 9) {
        d -= 9;
      }
    }

    sum += d;
    dbl = !dbl;
  }

  return sum % 10 === 0;
}


/**
 * Validate a match by category to reduce false positives.
 */
function validateMatch(
  category: DetectionCategory,
  text: string,
): boolean {
  switch (category) {
    case 'phone': {
      const digits = text.replace(/\D/g, '');

      // Need at least 7 digits to be a real phone number
      if (digits.length < 7) {
        return false;
      }

      // Reject if it's just a year or a normal number
      if (digits.length === 4) {
        return false;
      }

      // Reject pure decimal numbers that look like measurements
      // e.g. "3.14"
      if (/^\d+\.\d+$/.test(text.trim())) {
        return false;
      }

      return true;
    }

    case 'creditCard':
      return luhnCheck(text);

    case 'ip': {
      const parts = text.split('.');

      return parts.every((p) => {
        const n = parseInt(p, 10);
        return n >= 0 && n <= 255;
      });
    }

    case 'id': {
      // Reject if it's purely a year
      const digits = text.replace(/\D/g, '');

      if (
        digits.length === 4 &&
        parseInt(digits, 10) >= 1900 &&
        parseInt(digits, 10) <= 2100
      ) {
        return false;
      }

      return digits.length >= 4;
    }

    case 'ssn': {
      const parts = text.split('-');

      if (parts.length !== 3) {
        return false;
      }

      const area = parseInt(parts[0], 10);
      const group = parseInt(parts[1], 10);

      // Reject obviously invalid SSNs
      if (area === 0 || area === 666 || area >= 900) {
        return false;
      }

      if (group === 0) {
        return false;
      }

      return true;
    }

    case 'iban': {
      const cleaned = text.replace(/[\s-]/g, '');

      if (cleaned.length < 15 || cleaned.length > 34) {
        return false;
      }

      return true;
    }

    case 'email': {
      // Basic structural check beyond regex
      const atIdx = text.indexOf('@');

      if (atIdx < 1) {
        return false;
      }

      const domain = text.substring(atIdx + 1);

      if (!domain.includes('.')) {
        return false;
      }

      return true;
    }

    default:
      return true;
  }
}


/**
 * Calculate confidence for a detection.
 */
function getConfidence(
  category: DetectionCategory,
  text: string,
): number {
  switch (category) {
    case 'email':
      return 0.95;

    case 'creditCard':
      return luhnCheck(text) ? 0.95 : 0.3;

    case 'ssn':
      return 0.9;

    case 'iban':
      return 0.88;

    case 'url':
      return 0.9;

    case 'ip':
      return 0.85;

    case 'phone': {
      const digits = text.replace(/\D/g, '');

      if (digits.length >= 10) {
        return 0.85;
      }

      if (digits.length >= 7) {
        return 0.7;
      }

      return 0.4;
    }

    case 'id':
      return 0.65;

    case 'dob':
      return 0.6;

    case 'name':
      return 0.55;

    default:
      return 0.5;
  }
}


/**
 * Find all sensitive matches inside a text item.
 */
function findMatches(text: string): RawMatch[] {
  const matches: RawMatch[] = [];

  for (
    const key of Object.keys(COMPILED_PATTERNS) as DetectionCategory[]
  ) {
    const re = COMPILED_PATTERNS[key];

    // Reset global regexp state.
    re.lastIndex = 0;

    let m: RegExpExecArray | null;

    while ((m = re.exec(text)) !== null) {
      if (m[0].length < 3) {
        continue;
      }

      if (!validateMatch(key, m[0])) {
        continue;
      }

      matches.push({
        category: key,
        text: m[0],
        start: m.index,
        length: m[0].length,
        confidence: getConfidence(key, m[0]),
      });

      // Safety against malformed zero-length global regexes.
      if (m.index === re.lastIndex) {
        re.lastIndex++;
      }
    }
  }

  matches.sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    }

    return b.confidence - a.confidence;
  });


  // Remove overlapping matches — keep the one with higher confidence.
  const filtered: RawMatch[] = [];

  for (const m of matches) {
    const overlapIdx = filtered.findIndex(
      (f) =>
        m.start < f.start + f.length &&
        m.start + m.length > f.start,
    );

    if (overlapIdx === -1) {
      filtered.push(m);
    } else if (
      m.confidence > filtered[overlapIdx].confidence
    ) {
      filtered[overlapIdx] = m;
    }
  }

  return filtered.sort((a, b) => a.start - b.start);
}


/**
 * Merge text items that are on the same line and adjacent.
 *
 * PDF.js often splits:
 *
 *   john@
 *   gmail.com
 *
 * into separate text items.
 *
 * We merge them before detection so email/phone/ID detection can work
 * across those boundaries.
 */
function mergeTextItems(
  items: TextItem[],
): TextItem[] {
  const merged: TextItem[] = [];

  for (const item of items) {
    if (
      typeof item.str !== 'string' ||
      !item.str
    ) {
      continue;
    }

    const last = merged[merged.length - 1];

    if (last) {
      const [, , , , le, lf] = last.transform;
      const [a, b, , , e, f] = item.transform;

      const lastFontSize =
        Math.abs(last.transform[3]) ||
        Math.abs(last.transform[0]) ||
        10;

      const itemFontSize =
        Math.abs(a) || 10;

      // Same line if y is close and font size is similar.
      const sameLine =
        Math.abs(f - lf) <
        lastFontSize * 0.3;

      const sameSize =
        Math.abs(itemFontSize - lastFontSize) <
        lastFontSize * 0.2;

      // Adjacent if x is close to the end of last item.
      const lastEnd =
        le + (last.width || 0);

      const gap =
        e - lastEnd;

      const isAdjacent =
        gap >= -2 &&
        gap < lastFontSize * 0.8;

      // Check for rotation similarity.
      const sameRotation =
        Math.abs(
          b - last.transform[1],
        ) < 0.1;

      if (
        sameLine &&
        sameSize &&
        isAdjacent &&
        sameRotation
      ) {
        const combinedStr =
          last.str + item.str;

        merged[
          merged.length - 1
        ] = {
          str: combinedStr,
          transform: last.transform,
          width:
            (last.width || 0) +
            (item.width || 0),
          height: Math.max(
            last.height || 0,
            item.height || 0,
          ),
          hasEOL: item.hasEOL,
        };

        continue;
      }
    }

    merged.push({
      ...item,
    });
  }

  return merged;
}


/**
 * Detect sensitive information inside one PDF.js TextItem.
 */
function detectInItem(
  item: TextItem,
  pageIndex: number,
): Detection[] {
  const text = item.str;

  if (!text || !text.trim()) {
    return [];
  }

  const matches = findMatches(text);

  if (matches.length === 0) {
    return [];
  }

  return matches.map((m) => ({
    category: m.category,
    page: pageIndex,

    transform: item.transform,

    itemWidth:
      item.width || 0,

    itemText: text,

    matchStart: m.start,

    matchLength: m.length,

    height:
      item.height || 0,

    text: m.text,

    confidence: m.confidence,
  }));
}


/**
 * Detect sensitive items in a PDF page.
 */
export function detectSensitiveItems(
  textContent: PdfjsTextContent,
  pageIndex: number,
): Detection[] {
  // First merge adjacent text items on the same line.
  const merged =
    mergeTextItems(
      textContent.items,
    );

  const all: Detection[] = [];

  for (const item of merged) {
    all.push(
      ...detectInItem(
        item,
        pageIndex,
      ),
    );
  }

  return all;
}


/**
 * Convert a detection into a redaction rectangle in PDF user-space
 * coordinates (origin bottom-left, y-up).
 *
 * The rectangle is calculated from:
 *
 * - PDF.js transform
 * - complete TextItem width
 * - match character position
 * - weighted character widths
 * - font size
 *
 * This keeps the existing RedactionRegion API used by the UI.
 */
export function detectionToRegion(
  detection: Detection,
  padding = 1.5,
): RedactionRegion {
  const [
    a,
    b,
    c,
    d,
    e,
    f,
  ] = detection.transform;

  /*
   * PDF.js transform:
   *
   * [a, b, c, d, e, f]
   *
   * a/d are normally the horizontal/vertical scale.
   *
   * For safety we use the larger scale as the font-size estimate.
   */
  const fontSize = Math.max(
    Math.abs(a) || 0,
    Math.abs(d) || 0,
    8,
  );

  const itemText =
    detection.itemText || '';

  const textLength =
    itemText.length;


  /*
   * Fallback if the TextItem has no text.
   */
  if (!textLength) {
    return {
      page: detection.page,

      x: e - padding,

      y: f -
        fontSize * 0.82 -
        padding,

      width:
        Math.max(
          detection.itemWidth,
          1,
        ) +
        padding * 2,

      height:
        Math.max(
          fontSize * 1.25,
          detection.height || 0,
          6,
        ) +
        padding * 2,

      category:
        detection.category,

      text:
        detection.text,
    };
  }


  /*
   * Estimate character widths.
   *
   * PDF.js gives us the total advance width of the complete TextItem,
   * but not individual character rectangles.
   *
   * These weights provide a better approximation than simply dividing
   * width by character count.
   */
  function characterWeight(
    char: string,
  ): number {
    // Very narrow characters.
    if (/[ilI1|]/.test(char)) {
      return 0.45;
    }

    // Punctuation.
    if (/[.,'`:;!]/.test(char)) {
      return 0.35;
    }

    // Narrow-ish lowercase characters.
    if (/[fjrt]/.test(char)) {
      return 0.55;
    }

    // Wide characters.
    if (/[mwMW@%&]/.test(char)) {
      return 1.25;
    }

    // Uppercase.
    if (/[A-Z]/.test(char)) {
      return 1.05;
    }

    // Numbers.
    if (/[0-9]/.test(char)) {
      return 0.9;
    }

    // Spaces.
    if (/\s/.test(char)) {
      return 0.45;
    }

    // Brackets.
    if (/[()[\]{}<>]/.test(char)) {
      return 0.6;
    }

    return 0.85;
  }


  const characters =
    Array.from(itemText);

  const weights =
    characters.map(
      characterWeight,
    );

  const totalWeight =
    weights.reduce(
      (sum, value) =>
        sum + value,
      0,
    );


  /*
   * PDF.js TextItem width can occasionally be 0 or negative depending
   * on the source PDF.
   */
  const safeItemWidth =
    Math.max(
      Math.abs(
        detection.itemWidth,
      ) || 0,
      1,
    );


  /*
   * Width of one weighted unit.
   */
  const unitWidth =
    safeItemWidth /
    Math.max(
      totalWeight,
      1,
    );


  /*
   * Calculate weighted width before the match.
   */
  const beforeMatchWeight =
    weights
      .slice(
        0,
        Math.max(
          0,
          detection.matchStart,
        ),
      )
      .reduce(
        (sum, value) =>
          sum + value,
        0,
      );


  /*
   * Calculate weighted width of the match itself.
   */
  const matchWeights =
    weights
      .slice(
        Math.max(
          0,
          detection.matchStart,
        ),
        Math.max(
          0,
          detection.matchStart,
        ) +
          Math.max(
            0,
            detection.matchLength,
          ),
      )
      .reduce(
        (sum, value) =>
          sum + value,
        0,
      );


  const matchXOffset =
    beforeMatchWeight *
    unitWidth;

  const calculatedMatchWidth =
    matchWeights *
    unitWidth;


  /*
   * Never allow the rectangle to become too narrow.
   */
  const minimumWidth =
    Math.max(
      detection.matchLength *
        fontSize *
        0.35,
      4,
    );


  /*
   * Don't allow the match rectangle to exceed the TextItem width
   * unnecessarily.
   */
  const matchWidth =
    Math.max(
      calculatedMatchWidth,
      minimumWidth,
    );


  /*
   * Vertical position.
   *
   * PDF.js f is normally the text baseline.
   *
   * Move upward from the baseline to cover the actual glyph area,
   * while retaining a small amount of padding.
   */
  const verticalOffset =
    fontSize * 0.82;


  /*
   * Height of the redaction.
   */
  const height =
    Math.max(
      fontSize * 1.15,
      detection.height || 0,
      6,
    );


  return {
    page:
      detection.page,

    x:
      e +
      matchXOffset -
      padding,

    y:
      f -
      verticalOffset -
      padding,

    width:
      matchWidth +
      padding * 2,

    height:
      height +
      padding * 2,

    category:
      detection.category,

    text:
      detection.text,
  };
}


/**
 * Summarize/count detections by category.
 *
 * This function is required by redaction-ui.tsx:
 *
 *   const counts = summarizeDetections(allDetections);
 *
 * Every category is returned even when its count is zero.
 */
export function summarizeDetections(
  detections: Detection[],
): Record<DetectionCategory, number> {
  const counts =
    {} as Record<
      DetectionCategory,
      number
    >;


  /*
   * Initialize all categories.
   *
   * This is important because the UI expects:
   *
   * counts.email
   * counts.phone
   * counts.id
   * ...
   *
   * even when there are no detections.
   */
  for (
    const category of ALL_CATEGORIES
  ) {
    counts[category] = 0;
  }


  /*
   * Count every valid detection.
   */
  for (
    const detection of detections
  ) {
    if (
      counts[detection.category] !==
      undefined
    ) {
      counts[detection.category]++;
    }
  }


  return counts;
}