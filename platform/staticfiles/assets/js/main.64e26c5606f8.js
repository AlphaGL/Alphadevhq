(function(){
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Theme ---------------- */
  function getStoredTheme(){
    try { return localStorage.getItem("alphadev-theme"); } catch(e){ return null; }
  }
  function storeTheme(v){
    try { localStorage.setItem("alphadev-theme", v); } catch(e){}
  }
  function initTheme(){
    var stored = getStoredTheme();
    var theme = stored || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    root.setAttribute("data-theme", theme);
  }
  initTheme();

  function toggleTheme(){
    var current = root.getAttribute("data-theme");
    var next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    storeTheme(next);
  }

  document.addEventListener("DOMContentLoaded", function(){
    var toggles = document.querySelectorAll("[data-theme-toggle]");
    toggles.forEach(function(btn){
      btn.addEventListener("click", toggleTheme);
    });
  });

  /* ---------------- Loader ---------------- */
  window.addEventListener("load", function(){
    setTimeout(function(){ body.classList.add("is-ready"); }, 250);
  });
  // Fallback in case 'load' is delayed
  setTimeout(function(){ body.classList.add("is-ready"); }, 2200);

  /* ---------------- Nav state ---------------- */
  document.addEventListener("DOMContentLoaded", function(){
    var nav = document.querySelector(".nav");
    var toTop = document.querySelector(".to-top");
    var navLinks = document.querySelectorAll(".nav-links a, .mobile-menu a");

    // Pre-resolve each section to the nav links that point at it, once,
    // instead of querying the DOM again on every scroll event.
    var sections = Array.prototype.map.call(document.querySelectorAll("section[id]"), function(sec){
      var links = Array.prototype.filter.call(navLinks, function(l){
        return l.getAttribute("href") === "#" + sec.id;
      });
      return { el: sec, links: links };
    });

    var ticking = false;

    function update(){
      ticking = false;
      var scrollY = window.scrollY;

      nav.classList.toggle("is-scrolled", scrollY > 24);
      if (toTop) toTop.classList.toggle("is-visible", scrollY > 600);

      var scrollPos = scrollY + 160;
      sections.forEach(function(entry){
        var isActive = scrollPos >= entry.el.offsetTop && scrollPos < entry.el.offsetTop + entry.el.offsetHeight;
        entry.links.forEach(function(l){ l.classList.toggle("is-active", isActive); });
      });
    }

    function onScroll(){
      if (!ticking){
        ticking = true;
        requestAnimationFrame(update);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    /* Mobile menu */
    var menuToggle = document.querySelector(".menu-toggle");
    if (menuToggle){
      menuToggle.addEventListener("click", function(){
        body.classList.toggle("menu-open");
      });
      document.querySelectorAll(".mobile-menu a").forEach(function(a){
        a.addEventListener("click", function(){ body.classList.remove("menu-open"); });
      });
    }

    /* Dashboard sidebar (mobile) */
    var sidebarToggle = document.querySelector(".dash-sidebar-toggle");
    if (sidebarToggle){
      sidebarToggle.addEventListener("click", function(){
        body.classList.toggle("sidebar-open");
      });
      document.querySelectorAll(".dash-sidebar-nav a").forEach(function(a){
        a.addEventListener("click", function(){ body.classList.remove("sidebar-open"); });
      });
      document.addEventListener("click", function(e){
        if (!body.classList.contains("sidebar-open")) return;
        var sidebar = document.querySelector(".dash-sidebar");
        if (sidebar && !sidebar.contains(e.target) && e.target !== sidebarToggle && !sidebarToggle.contains(e.target)){
          body.classList.remove("sidebar-open");
        }
      });
    }
  });

  /* ---------------- Reveal on scroll ---------------- */
  document.addEventListener("DOMContentLoaded", function(){
    var targets = document.querySelectorAll("[data-reveal], [data-reveal-stagger]");
    if (!("IntersectionObserver" in window) || prefersReduced){
      targets.forEach(function(t){ t.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -60px 0px" });
    targets.forEach(function(t){ io.observe(t); });

    // Safety net: a section already in view when the observer attaches can
    // be missed on some mobile browsers (timing/throttling quirks), which
    // leaves it stuck at opacity:0 forever. Force-reveal anything still
    // hidden after a few seconds regardless.
    setTimeout(function(){
      targets.forEach(function(t){ t.classList.add("is-visible"); });
    }, 2500);
  });

  /* ---------------- Counters ---------------- */
  document.addEventListener("DOMContentLoaded", function(){
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;
    function animateCounter(el){
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      var decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"),10) : 0;
      var dur = 1400;
      var start = null;
      function step(ts){
        if (!start) start = ts;
        var progress = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var val = target * eased;
        el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      if (prefersReduced){
        el.textContent = (decimals ? target.toFixed(decimals) : target) + suffix;
      } else {
        requestAnimationFrame(step);
      }
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          animateCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function(c){ io.observe(c); });
  });

  /* ---------------- Custom cursor ---------------- */
  document.addEventListener("DOMContentLoaded", function(){
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    var dot = document.querySelector(".cursor-dot");
    var ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;

    var mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener("mousemove", function(e){
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top = my + "px";
    });
    function loop(){
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    }
    loop();

    document.querySelectorAll("a, button, [data-magnetic]").forEach(function(el){
      el.addEventListener("mouseenter", function(){ ring.classList.add("is-active"); });
      el.addEventListener("mouseleave", function(){ ring.classList.remove("is-active"); });
    });
  });

  /* ---------------- Magnetic buttons ---------------- */
  document.addEventListener("DOMContentLoaded", function(){
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches || prefersReduced) return;
    document.querySelectorAll("[data-magnetic]").forEach(function(el){
      el.addEventListener("mousemove", function(e){
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width/2;
        var y = e.clientY - r.top - r.height/2;
        el.style.transform = "translate(" + (x*0.25) + "px," + (y*0.35) + "px)";
      });
      el.addEventListener("mouseleave", function(){
        el.style.transform = "translate(0,0)";
      });
    });
  });

  /* ---------------- Orb parallax ---------------- */
  document.addEventListener("DOMContentLoaded", function(){
    if (prefersReduced) return;
    var orbs = document.querySelectorAll(".atmosphere .orb");
    if (!orbs.length) return;
    var pending = false, lastX = 0.5, lastY = 0.5;

    function apply(){
      pending = false;
      var cx = lastX - 0.5, cy = lastY - 0.5;
      orbs.forEach(function(orb, i){
        var depth = (i + 1) * 10;
        orb.style.marginLeft = (cx * depth) + "px";
        orb.style.marginTop = (cy * depth) + "px";
      });
    }

    window.addEventListener("mousemove", function(e){
      lastX = e.clientX / window.innerWidth;
      lastY = e.clientY / window.innerHeight;
      if (!pending){
        pending = true;
        requestAnimationFrame(apply);
      }
    }, { passive: true });
  });

  /* ---------------- Work filter ---------------- */
  document.addEventListener("DOMContentLoaded", function(){
    var filterBtns = document.querySelectorAll(".filter-btn");
    var cards = document.querySelectorAll(".work-card");
    if (!filterBtns.length) return;
    filterBtns.forEach(function(btn){
      btn.addEventListener("click", function(){
        filterBtns.forEach(function(b){ b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        var filter = btn.getAttribute("data-filter");
        cards.forEach(function(card){
          var cat = card.getAttribute("data-category");
          var show = filter === "all" || filter === cat;
          card.classList.toggle("is-hidden", !show);
        });
      });
    });
  });

  /* ---------------- Tilt on project cards ---------------- */
  document.addEventListener("DOMContentLoaded", function(){
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches || prefersReduced) return;
    document.querySelectorAll(".work-card").forEach(function(card){
      card.addEventListener("mousemove", function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateX(" + (py * -4) + "deg) rotateY(" + (px * 5) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function(){
        card.style.transform = "";
      });
    });
  });

  /* ---------------- Testimonial carousel ---------------- */
  document.addEventListener("DOMContentLoaded", function(){
    var rail = document.querySelector(".testimonial-rail");
    if (!rail) return;
    var slides = rail.children.length;
    var index = 0;
    var dotsWrap = document.querySelector(".t-dots");
    var dots = [];

    for (var i = 0; i < slides; i++){
      var d = document.createElement("button");
      if (i === 0) d.classList.add("is-active");
      d.setAttribute("aria-label", "Show testimonial " + (i+1));
      (function(idx){ d.addEventListener("click", function(){ goTo(idx); }); })(i);
      dotsWrap.appendChild(d);
      dots.push(d);
    }

    function goTo(i){
      index = (i + slides) % slides;
      rail.style.transform = "translateX(-" + (index * 100) + "%)";
      dots.forEach(function(d, di){ d.classList.toggle("is-active", di === index); });
    }

    var prevBtn = document.querySelector(".t-prev");
    var nextBtn = document.querySelector(".t-next");
    if (prevBtn) prevBtn.addEventListener("click", function(){ goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function(){ goTo(index + 1); });

    var auto = setInterval(function(){ goTo(index + 1); }, 6000);
    var wrap = document.querySelector(".testimonial-wrap");
    if (wrap){
      wrap.addEventListener("mouseenter", function(){ clearInterval(auto); });
    }

    /* swipe */
    var startX = null;
    rail.addEventListener("touchstart", function(e){ startX = e.touches[0].clientX; }, { passive: true });
    rail.addEventListener("touchend", function(e){
      if (startX === null) return;
      var diff = e.changedTouches[0].clientX - startX;
      if (diff > 40) goTo(index - 1);
      else if (diff < -40) goTo(index + 1);
      startX = null;
    });
  });

  /* ---------------- Work filter from service tags ---------------- */
  document.addEventListener("DOMContentLoaded", function(){
    document.querySelectorAll("[data-filter-jump]").forEach(function(tag){
      tag.addEventListener("click", function(){
        var target = tag.getAttribute("data-filter-jump");
        var filterBtn = document.querySelector('.filter-btn[data-filter="' + target + '"]');
        if (filterBtn) filterBtn.click();
        var work = document.getElementById("work");
        if (work) work.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
      });
    });
  });

  /* ---------------- Lightbox gallery ---------------- */
  document.addEventListener("DOMContentLoaded", function(){
    var lightbox = document.querySelector(".lightbox");
    if (!lightbox) return;
    var stage = lightbox.querySelector(".lightbox-stage");
    var titleEl = lightbox.querySelector(".lightbox-title");
    var metaEl = lightbox.querySelector(".lightbox-meta");
    var visitLink = lightbox.querySelector(".lightbox-visit");
    var countEl = lightbox.querySelector(".lightbox-count");
    var prevBtn = lightbox.querySelector(".lightbox-prev");
    var nextBtn = lightbox.querySelector(".lightbox-next");

    var images = [];
    var idx = 0;

    function render(){
      stage.querySelectorAll("img").forEach(function(im){ im.remove(); });
      images.forEach(function(src, i){
        var im = document.createElement("img");
        im.src = src;
        im.alt = "";
        if (i === idx) im.classList.add("is-active");
        stage.appendChild(im);
      });
      countEl.textContent = (idx + 1) + " / " + images.length;
    }

    function open(gallery, title, meta, link){
      images = gallery;
      idx = 0;
      titleEl.textContent = title;
      metaEl.textContent = meta;
      if (link){
        visitLink.href = link;
        visitLink.style.display = "";
      } else {
        visitLink.style.display = "none";
      }
      render();
      lightbox.classList.add("is-open");
      document.body.classList.add("lightbox-open");
    }
    function close(){
      lightbox.classList.remove("is-open");
      document.body.classList.remove("lightbox-open");
    }
    function go(delta){
      idx = (idx + delta + images.length) % images.length;
      render();
    }

    document.querySelectorAll(".work-stack[data-gallery]").forEach(function(stack){
      stack.addEventListener("click", function(){
        var gallery = stack.getAttribute("data-gallery").split(",").map(function(s){ return s.trim(); });
        var card = stack.closest("[data-title]");
        var title = card.getAttribute("data-title") || "";
        var meta = card.getAttribute("data-meta") || "";
        var link = card.getAttribute("data-link") || "#";
        open(gallery, title, meta, link);
      });
    });

    lightbox.querySelectorAll("[data-lightbox-close]").forEach(function(el){
      el.addEventListener("click", close);
    });
    prevBtn.addEventListener("click", function(){ go(-1); });
    nextBtn.addEventListener("click", function(){ go(1); });

    document.addEventListener("keydown", function(e){
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    });

    var startX = null;
    stage.addEventListener("touchstart", function(e){ startX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function(e){
      if (startX === null) return;
      var diff = e.changedTouches[0].clientX - startX;
      if (diff > 40) go(-1);
      else if (diff < -40) go(1);
      startX = null;
    });
  });

  /* ---------------- Free website checker ---------------- */
  /*
   * Uses Google's PageSpeed Insights API. The unauthenticated quota is 0,
   * so this needs a free API key: https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com
   * Enable the API, create an API key under Credentials, paste it below.
   */
  var PSI_API_KEY = "AIzaSyBi606B9hjNEEMPl5KRtCnCNLByIgFJT2M";

  document.addEventListener("DOMContentLoaded", function(){
    var form = document.getElementById("checkerForm");
    if (!form) return;

    var input = document.getElementById("checkerUrl");
    var submitBtn = document.getElementById("checkerSubmit");
    var loadingEl = document.getElementById("checkerLoading");
    var errorEl = document.getElementById("checkerError");
    var errorMsg = document.getElementById("checkerErrorMsg");
    var errorCta = document.getElementById("checkerErrorCta");
    var resultsEl = document.getElementById("checkerResults");
    var scoresEl = document.getElementById("checkerScores");
    var verdictEl = document.getElementById("checkerVerdict");
    var ctaEl = document.getElementById("checkerCta");

    var CATEGORY_LABELS = {
      performance: "Performance",
      seo: "SEO",
      accessibility: "Accessibility",
      "best-practices": "Best Practices"
    };
    var CATEGORY_DESCRIPTIONS = {
      performance: "How fast your pages load and respond. Slow sites lose visitors and rank lower on Google.",
      seo: "How easy it is for Google to read, index and rank your pages. Higher SEO means more people find you through search.",
      accessibility: "How usable your site is for people with disabilities and screen readers. Also a factor in Google rankings.",
      "best-practices": "Security, modern coding standards and avoiding common errors that make a site feel outdated or unsafe."
    };

    function showState(state){
      loadingEl.hidden = state !== "loading";
      errorEl.hidden = state !== "error";
      resultsEl.hidden = state !== "results";
      submitBtn.disabled = state === "loading";
    }

    function normalizeUrl(raw){
      var v = raw.trim();
      if (!v) return null;
      if (!/^https?:\/\//i.test(v)) v = "https://" + v;
      try {
        var u = new URL(v);
        if (!u.hostname.includes(".")) return null;
        return u.href;
      } catch (e){
        return null;
      }
    }

    function renderScores(categories){
      scoresEl.innerHTML = "";
      var lowestKey = null, lowestVal = 101;
      Object.keys(CATEGORY_LABELS).forEach(function(key){
        var cat = categories[key];
        if (!cat || typeof cat.score !== "number") return;
        var val = Math.round(cat.score * 100);
        if (val < lowestVal){ lowestVal = val; lowestKey = key; }

        var row = document.createElement("div");
        row.className = "score-row";
        row.innerHTML =
          '<div class="score-row-head"><span>' + CATEGORY_LABELS[key] + '</span><span class="score-num">0</span></div>' +
          '<div class="score-track"><div class="score-fill"></div></div>' +
          '<p class="score-row-desc">' + CATEGORY_DESCRIPTIONS[key] + '</p>';
        scoresEl.appendChild(row);

        var numEl = row.querySelector(".score-num");
        var fillEl = row.querySelector(".score-fill");
        requestAnimationFrame(function(){
          fillEl.style.width = val + "%";
          var start = null;
          function step(ts){
            if (!start) start = ts;
            var p = Math.min((ts - start) / 900, 1);
            numEl.textContent = Math.round(val * p);
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      });
      return { lowestKey: lowestKey, lowestVal: lowestVal };
    }

    function verdictFor(lowestKey, lowestVal, url){
      if (lowestKey === null) return "We ran the check but could not read a clear score back. Send us the link and we will take a closer look manually.";
      var label = CATEGORY_LABELS[lowestKey];
      if (lowestVal >= 90) return "Solid scores across the board. If you want, we can still run a manual pass to tighten things further.";
      if (lowestVal >= 50) return label + " is the weakest area at " + lowestVal + "/100. That is a fixable gap, not a rebuild.";
      return label + " is scoring low at " + lowestVal + "/100. This is exactly the kind of thing we fix as part of a rebuild or SEO pass.";
    }

    function socialLink(){
      return "https://wa.me/2348138582078";
    }

    form.addEventListener("submit", function(e){
      e.preventDefault();
      var url = normalizeUrl(input.value);
      if (!url){
        input.focus();
        return;
      }

      errorCta.href = socialLink();

      if (!PSI_API_KEY){
        showState("error");
        errorMsg.textContent = "The free checker is warming up right now. Send us the link directly and we will run it for you by hand.";
        return;
      }

      showState("loading");

      var endpoint = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
        + "?url=" + encodeURIComponent(url)
        + "&strategy=mobile"
        + "&category=performance&category=seo&category=accessibility&category=best-practices"
        + "&key=" + encodeURIComponent(PSI_API_KEY);

      var controller = ("AbortController" in window) ? new AbortController() : null;
      var timeout = setTimeout(function(){ if (controller) controller.abort(); }, 45000);

      fetch(endpoint, controller ? { signal: controller.signal } : {})
        .then(function(res){
          if (!res.ok) throw new Error("status " + res.status);
          return res.json();
        })
        .then(function(data){
          clearTimeout(timeout);
          var categories = data && data.lighthouseResult && data.lighthouseResult.categories;
          if (!categories) throw new Error("no categories");

          var summary = renderScores(categories);
          verdictEl.textContent = verdictFor(summary.lowestKey, summary.lowestVal, url);
          ctaEl.href = socialLink();
          showState("results");
        })
        .catch(function(){
          clearTimeout(timeout);
          showState("error");
          errorMsg.textContent = "Google's checker did not respond in time. Try again in a moment, or send us the link directly.";
        });
    });
  });

  /* ---------------- Back to top ---------------- */
  document.addEventListener("DOMContentLoaded", function(){
    var toTop = document.querySelector(".to-top");
    if (!toTop) return;
    toTop.addEventListener("click", function(){
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  /* ---------------- Current year ---------------- */
  document.addEventListener("DOMContentLoaded", function(){
    document.querySelectorAll("[data-year]").forEach(function(el){
      el.textContent = new Date().getFullYear();
    });
  });

})();
