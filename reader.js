(function () {
  const bookEl = document.getElementById("book");
  const tocList = document.getElementById("toc-list");
  const toc = document.getElementById("toc");
  const tocToggle = document.getElementById("toc-toggle");
  const randomBtn = document.getElementById("random-entry");
  const modeToggle = document.getElementById("mode-toggle");

  function slug(text) {
    return text
      .toLowerCase()
      .replace(/<[^>]+>/g, "")
      .replace(/&[a-z]+;/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "");
  }

  function addHeadingIds(html) {
    return html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, function (_, depth, inner) {
      const id = slug(inner);
      if (!id) return "<h" + depth + ">" + inner + "</h" + depth + ">";
      return '<h' + depth + ' id="' + id + '">' + inner + "</h" + depth + ">";
    });
  }

  function collectToc(root) {
    const items = [];
    root.querySelectorAll("h1, h2").forEach(function (heading) {
      const title = heading.textContent.replace(/^\*+|\*+$/g, "").trim();
      if (!heading.id || !title) return;
      items.push({ id: heading.id, title: title });
    });
    return items;
  }

  function closeToc() {
    toc.setAttribute("hidden", "");
    tocToggle.setAttribute("aria-expanded", "false");
  }

  function renderToc(items) {
    tocList.innerHTML = items
      .map(function (item) {
        return '<a href="#' + item.id + '">' + item.title + "</a>";
      })
      .join("");
    tocList.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeToc);
    });
  }

  function syncModeButton() {
    if (!modeToggle) return;
    const night = document.documentElement.getAttribute("data-mode") === "night";
    modeToggle.setAttribute("aria-pressed", String(night));
    modeToggle.textContent = night ? "[day]" : "[night]";
  }

  tocToggle.addEventListener("click", function () {
    const open = toc.hasAttribute("hidden");
    if (open) toc.removeAttribute("hidden");
    else toc.setAttribute("hidden", "");
    tocToggle.setAttribute("aria-expanded", String(open));
  });

  randomBtn.addEventListener("click", function () {
    const entries = Array.from(document.querySelectorAll(".book h2[id]")).filter(function (el) {
      return el.textContent.trim().length > 0;
    });
    if (!entries.length) return;
    const target = entries[Math.floor(Math.random() * entries.length)];
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    closeToc();
  });

  if (modeToggle) {
    syncModeButton();
    modeToggle.addEventListener("click", function () {
      const night = document.documentElement.getAttribute("data-mode") === "night";
      if (night) {
        document.documentElement.removeAttribute("data-mode");
        try {
          localStorage.setItem("tur-book-mode", "day");
        } catch (e) {}
      } else {
        document.documentElement.setAttribute("data-mode", "night");
        try {
          localStorage.setItem("tur-book-mode", "night");
        } catch (e) {}
      }
      syncModeButton();
    });
  }

  fetch("THE-SHADOW-PHASE.md")
    .then(function (response) {
      if (!response.ok) throw new Error("Could not load the book.");
      return response.text();
    })
    .then(function (markdown) {
      const splitAt = markdown.indexOf("## **§0");
      const front = splitAt === -1 ? "" : markdown.slice(0, splitAt);
      const body = splitAt === -1 ? markdown : markdown.slice(splitAt);
      const frontHtml = marked.parse(front);
      const bodyHtml = addHeadingIds(marked.parse(body));

      bookEl.innerHTML =
        '<section class="front">' + frontHtml + "</section>" +
        '<section class="body">' + bodyHtml + "</section>";

      renderToc(collectToc(bookEl));
    })
    .catch(function () {
      bookEl.innerHTML =
        '<p class="book-error">The book could not be loaded. Open <a href="THE-SHADOW-PHASE.md">THE-SHADOW-PHASE.md</a>.</p>';
    });
})();
