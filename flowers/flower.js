// flower.js — one unique generated flower per blog article.
// Requires the vendored nonflowers.js (Nonflowers by Lingdong Huang, MIT)
// to be loaded BEFORE this file. Each article page calls:
//
//   renderFlower(document.getElementById("flower"), "article-slug");
//
// The slug seeds the generator, so an article's flower is deterministic:
// the same slug always paints the same flower, and different slugs paint
// different flowers.

function renderFlower(container, slug) {
  var note = document.createElement("p");
  note.className = "flower-note";
  note.textContent = "Painting this article\u2019s flower\u2026";
  container.appendChild(note);

  // Let the page paint first; the generator blocks for a second or two.
  setTimeout(function () {
    try {
      Math.seed("charan-blog:" + slug);
      generate(); // from nonflowers.js; paints into the global CTX canvas
      var canvas = CTX.canvas; // 600x600; scaled down via CSS
      container.replaceChild(canvas, note);
    } catch (e) {
      note.textContent = "This article\u2019s flower could not be painted in this browser.";
    }
  }, 40);
}
