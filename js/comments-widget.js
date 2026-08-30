/*!
 * Edu Abroad Limited — Reusable Comments Widget
 * ---------------------------------------------------
 * Drop this anywhere on any page:
 *
 *   <div data-edu-comments
 *        data-page-id="blog-5-steps-sop"
 *        data-page-title="5 Steps to a Winning Statement of Purpose"
 *        data-show-rating></div>
 *
 * - data-page-id (required): a unique key per page/post. Comments are
 *   grouped and stored under this key.
 * - data-page-title (optional): human-readable label, only used inside
 *   the admin dashboard's activity log.
 * - data-show-rating (optional attribute, no value needed): shows a
 *   1-5 star picker alongside the comment box.
 *
 * Data is saved through window.EduAuth (see js/app-data.js), which
 * currently persists to localStorage. To go live with a real backend,
 * only EduAuth.submitComment / commentsForPage need to change — this
 * widget never talks to storage directly.
 */
(function (window, document) {
  "use strict";

  function escapeHTML(str) {
    return (str || "").toString().replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function timeAgo(iso) {
    var diff = Date.now() - new Date(iso).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    var days = Math.floor(hrs / 24);
    if (days < 30) return days + "d ago";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function initials(name) {
    return (name || "?").trim().split(/\s+/).map(function (p) { return p[0]; }).slice(0, 2).join("").toUpperCase();
  }

  function renderStars(rating) {
    if (!rating) return "";
    var out = "";
    for (var i = 1; i <= 5; i++) {
      out += '<span style="color:' + (i <= rating ? "#f5b301" : "#e5e7eb") + '">&#9733;</span>';
    }
    return '<div class="text-xs mb-1 leading-none">' + out + "</div>";
  }

  var widgetCount = 0;

  function buildWidget(container) {
    var pageId = container.getAttribute("data-page-id");
    var pageTitle = container.getAttribute("data-page-title") || document.title;
    var showRating = container.hasAttribute("data-show-rating");
    var uidSuffix = "ec" + (widgetCount++);

    if (!pageId) {
      console.warn("[EduComments] Missing data-page-id attribute on", container);
      return;
    }

    container.innerHTML =
      '<div class="edu-comments-root max-w-3xl mx-auto text-left">' +
      '<h3 class="font-display text-xl sm:text-2xl font-bold text-gray-900 mb-5">' +
      "Comments <span id=\"" + uidSuffix + "-count\" class=\"text-gray-400 font-normal text-base align-middle\"></span>" +
      "</h3>" +
      '<div id="' + uidSuffix + '-list" class="space-y-4 mb-8"></div>' +
      '<form id="' + uidSuffix + '-form" class="bg-white border border-gray-100 rounded-2xl shadow-[0_2px_12px_rgb(0,0,0,0.04)] p-5 sm:p-6 space-y-4">' +
      '<p class="font-semibold text-gray-900 text-sm">Leave a comment</p>' +
      '<div class="grid sm:grid-cols-2 gap-4">' +
      '<input type="text" name="name" required maxlength="80" placeholder="Your name" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />' +
      '<input type="email" name="email" required maxlength="120" placeholder="Your email (not published)" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />' +
      "</div>" +
      (showRating
        ? '<div class="ec-rating flex items-center gap-1" data-value="0">' +
          [1, 2, 3, 4, 5].map(function (i) {
            return '<button type="button" data-star="' + i + '" class="ec-star text-2xl leading-none" style="color:#d1d5db">&#9733;</button>';
          }).join("") +
          "</div>"
        : "") +
      '<textarea name="message" required maxlength="1000" rows="3" placeholder="Write your comment..." class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"></textarea>' +
      '<input type="text" name="website" class="hidden" tabindex="-1" autocomplete="off" />' +
      '<div class="flex items-center justify-between gap-3 flex-wrap">' +
      '<p id="' + uidSuffix + '-msg" class="text-xs"></p>' +
      '<button type="submit" class="shrink-0 bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-90 transition">Post Comment</button>' +
      "</div>" +
      "</form>" +
      "</div>";

    function renderList() {
      var comments = window.EduAuth.commentsForPage(pageId);
      var listEl = document.getElementById(uidSuffix + "-list");
      var countEl = document.getElementById(uidSuffix + "-count");
      countEl.textContent = comments.length ? "(" + comments.length + ")" : "";
      listEl.innerHTML = comments.length
        ? comments.map(function (c) {
          return '<div class="flex gap-3">' +
            '<div class="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">' + escapeHTML(initials(c.name)) + "</div>" +
            '<div class="flex-1 bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3">' +
            '<div class="flex items-center justify-between gap-2 mb-0.5">' +
            '<p class="font-semibold text-gray-900 text-sm">' + escapeHTML(c.name) + "</p>" +
            '<p class="text-[11px] text-gray-400 shrink-0">' + timeAgo(c.createdAt) + "</p>" +
            "</div>" +
            renderStars(c.rating) +
            '<p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">' + escapeHTML(c.message) + "</p>" +
            "</div>" +
            "</div>";
        }).join("")
        : '<p class="text-sm text-gray-400">Be the first to comment.</p>';
    }

    var ratingWrap = container.querySelector(".ec-rating");
    if (ratingWrap) {
      ratingWrap.addEventListener("click", function (e) {
        var btn = e.target.closest(".ec-star");
        if (!btn) return;
        var val = parseInt(btn.getAttribute("data-star"), 10);
        ratingWrap.setAttribute("data-value", String(val));
        ratingWrap.querySelectorAll(".ec-star").forEach(function (s) {
          var sv = parseInt(s.getAttribute("data-star"), 10);
          s.style.color = sv <= val ? "#f5b301" : "#d1d5db";
        });
      });
    }

    var form = document.getElementById(uidSuffix + "-form");
    var msgEl = document.getElementById(uidSuffix + "-msg");

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!window.EduAuth || typeof window.EduAuth.submitComment !== "function") {
        msgEl.textContent = "Comments are unavailable right now.";
        msgEl.className = "text-xs text-red-500";
        return;
      }

      var fd = new FormData(form);
      if (fd.get("website")) return; // honeypot tripped — silently ignore

      var name = (fd.get("name") || "").toString().trim();
      var email = (fd.get("email") || "").toString().trim();
      var message = (fd.get("message") || "").toString().trim();

      if (!name || !email || !message) {
        msgEl.textContent = "Please fill in all fields.";
        msgEl.className = "text-xs text-red-500";
        return;
      }

      var rating = ratingWrap ? (parseInt(ratingWrap.getAttribute("data-value"), 10) || null) : null;

      window.EduAuth.submitComment({
        pageId: pageId,
        pageTitle: pageTitle,
        name: name,
        email: email,
        message: message,
        rating: rating
      });

      form.reset();
      if (ratingWrap) {
        ratingWrap.setAttribute("data-value", "0");
        ratingWrap.querySelectorAll(".ec-star").forEach(function (s) { s.style.color = "#d1d5db"; });
      }
      msgEl.textContent = "Thanks! Your comment has been posted.";
      msgEl.className = "text-xs text-green-600";
      renderList();
      setTimeout(function () { msgEl.textContent = ""; }, 4000);
    });

    renderList();
  }

  function init() {
    var containers = document.querySelectorAll("[data-edu-comments]");
    if (!containers.length) return;

    containers.forEach(function (el) {
      if (el.getAttribute("data-edu-comments-ready")) return;
      el.setAttribute("data-edu-comments-ready", "1");

      if (window.EduAuth) {
        buildWidget(el);
        return;
      }
      // app-data.js loaded after this script on some pages — wait briefly.
      var tries = 0;
      var iv = setInterval(function () {
        tries++;
        if (window.EduAuth) {
          clearInterval(iv);
          buildWidget(el);
        } else if (tries > 30) {
          clearInterval(iv);
          console.warn("[EduComments] window.EduAuth (js/app-data.js) was not found.");
        }
      }, 100);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.EduCommentsWidget = { init: init };
})(window, document);
