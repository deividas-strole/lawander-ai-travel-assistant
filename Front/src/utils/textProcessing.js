// Remove leading markdown-like tokens from popup text only (e.g. ###, -, *, bullets)
export const sanitizeLeading = (s) => {
  if (!s && s !== "") return s;
  const str = String(s);
  return str.replace(/^\s*(?:[#\-\*\u2022]+[\s:]*)+/, "").trim();
};

export const extractPlaceNames = (text) => {
  console.log("Extracting place names from text:", text);
  const regex = /\*\*(.*?)\*\*/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1].trim());
  }
  console.log("Found matches:", matches);
  return matches;
};

export const extractPlaceDescriptions = (text, placeNames) => {
  const descriptions = {};

  const textForDescriptions = String(text).replace(/^[ \t]*[-*•]?\s*#*\s*day\s*\d+(?::|-)?\s*.*$/gim, "\n");

  const sentences = textForDescriptions
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  placeNames.forEach((placeName) => {
    const relevantSentences = sentences.filter((sentence) =>
      sentence.toLowerCase().includes(placeName.toLowerCase())
    );

    if (relevantSentences.length > 0) {
      let description = relevantSentences[0];

      description = description
        .replace(new RegExp(`\\*\\*${placeName}\\*\\*`, "gi"), "")
        .trim();

      description = description.replace(/:/g, "");

      description = description.replace(
        /^(is|are|was|were|has|have|had|will|would|can|could|should|may|might)\s+/i,
        ""
      );

      description =
        description.charAt(0).toUpperCase() + description.slice(1);

      description = sanitizeLeading(description);
      descriptions[placeName] = description;
    }
  });

  console.log("Extracted place descriptions:", descriptions);
  return descriptions;
};

export const formatMessageText = (text, foundPlaces = []) => {
  if (foundPlaces.length === 0) {
    return text.replace(/\*\*(.*?)\*\*/g, "$1");
  }

  const foundLower = foundPlaces.map((p) => p.toLowerCase());
  return text.replace(/\*\*(.*?)\*\*/g, (match, placeName) => {
    const trimmedPlaceName = placeName.trim();
    if (foundLower.includes(trimmedPlaceName.toLowerCase())) {
      return `<span class="place-name clickable-place" data-place="${trimmedPlaceName}">${placeName}</span>`;
    } else {
      return placeName;
    }
  });
};

export const formatItineraryToHtml = (rawText, foundPlaces = []) => {
  if (!rawText) return "";
  const normalized = rawText.replace(/\r\n/g, "\n");
  const lines = normalized
    .split("\n")
    .map((l) => l.replace(/^\s*###\s*/i, "").trim());

  const daySections = [];
  let current = null;
  const dayHeaderRegex = /^#*\s*day\s*(\d+)(?::|-)?\s*(.*)$/i;

  const pushCurrent = () => {
    if (current) {
      current.items = current.items.filter((i) => i.trim().length > 0);
      daySections.push(current);
      current = null;
    }
  };

  const foundLower = foundPlaces.map((p) => p.toLowerCase());
  const foundMap = {};
  foundPlaces.forEach((p) => (foundMap[p.toLowerCase()] = p));

  for (let rawLine of lines) {
    if (!rawLine) continue;
    let line = rawLine.replace(/^[-*•]\s*/, "").trim();
    if (!line) continue;
    const m = line.match(dayHeaderRegex);
    if (m) {
      pushCurrent();
      const dayNum = m[1];
      const rest = (m[2] || "").trim();
      current = {
        title: `Day ${dayNum}${rest ? `: ${rest}` : ""}`,
        items: [],
      };
      continue;
    }
    if (!current) continue;

    let cleaned = line.replace(/^[-*•]\s*/, "");
    const dashIdx = cleaned.indexOf(" - ");
    let itemHtml = cleaned;
    const wrapPlace = (placeLabel) => {
      const original = foundMap[placeLabel.toLowerCase()] || placeLabel;
      return `<span class=\"place-name clickable-place blue-place\" data-place=\"${original}\">${original}</span>`;
    };

    if (dashIdx > 0) {
      let left = cleaned.substring(0, dashIdx).trim();
      let rest = cleaned.substring(dashIdx + 3);

      left = left.replace(/^[0-9]+\.\s*/, "").replace(/^[-*•]\s*/, "");

      const leftUnmarked = left.replace(/^\*\*(.*)\*\*$/, "$1").trim();

      let matched = null;
      if (foundLower.includes(leftUnmarked.toLowerCase())) {
        matched = foundMap[leftUnmarked.toLowerCase()];
      } else {
        for (const p of foundPlaces.sort((a, b) => b.length - a.length)) {
          if (leftUnmarked.toLowerCase().includes(p.toLowerCase())) {
            matched = p;
            break;
          }
        }
      }

      if (matched) {
        const wrapped = wrapPlace(matched);
        itemHtml = `${wrapped} - ${rest}`;
      } else {
        itemHtml = `${left} - ${rest}`;
      }
    } else {
      const prefix = cleaned.substring(0, 60);
      let matched = null;
      for (const p of foundPlaces.sort((a, b) => b.length - a.length)) {
        if (prefix.toLowerCase().includes(p.toLowerCase())) {
          matched = p;
          break;
        }
      }
      if (matched) {
        const wrapped = wrapPlace(matched);
        itemHtml = cleaned.replace(new RegExp(matched.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), wrapped);
      }
    }

    current.items.push(itemHtml);
  }
  pushCurrent();

  if (daySections.length === 0) {
    return normalized
      .split("\n")
      .filter((l) => l.trim().length > 0)
      .map((l) => l.replace(/^\s*###\s*/i, ""))
      .join("<br/>");
  }

  const html = daySections
    .map((d) => {
      const itemsHtml = d.items.join("<br/>");
      return `<p style=\"margin: 0 0 14px 0;\"><strong>${d.title}</strong><br/>${itemsHtml}</p>`;
    })
    .join("\n");
  return html;
};