// src/parser/observer.ts
import axios from "axios";

export class Observer {
  constructor(
    private baseUrl = process.env.CRAWL4AI_URL || "http://localhost:11235",
  ) {}

  /**
   * Given a page URL and a description like "the search input box at the top",
   * find a matching element and return its unique CSS selector.
   */
  async findSelectorByDescription(
    url: string,
    description: string,
  ): Promise<string> {
    const script = `
      (() => {
        const desc = ${JSON.stringify(description.toLowerCase())};
        // collect all elements whose text contains the description
        const candidates = Array.from(document.querySelectorAll('*'))
          .filter(el => (el.textContent||'').toLowerCase().includes(desc));
        if (!candidates.length) return '';
        const el = candidates[0];
        // build a simple unique selector
        function uniqueSelector(e) {
          if (e.id) return '#' + e.id;
          const path = [];
          while (e && e.nodeType === Node.ELEMENT_NODE) {
            let sel = e.tagName.toLowerCase();
            if (e.className) {
              sel += '.' + 
                Array.from(e.classList)
                  .map(c => c.trim())
                  .filter(Boolean)
                  .join('.');
            }
            path.unshift(sel);
            e = e.parentElement;
          }
          return path.join(' > ');
        }
        return uniqueSelector(el);
      })();
    `;
    const res = await axios.post(`${this.baseUrl}/execute_js`, {
      url,
      scripts: [script],
    });
    // The API returns an array of results for each script
    return Array.isArray(res.data) ? res.data[0] : "";
  }
}
