
/*
  ============================================================
  CRIMSON TYPHOON PORTFOLIO CONTROLLER
  ============================================================

  LIVE DATA ARCHITECTURE

  The browser tries:

      /api/portfolio/stats
      /api/portfolio/research

  Keep private HTB/PicoCTF credentials on your server.
  DO NOT put API tokens inside this JavaScript file.

  Expected stats response:

  {
    "ctfs": 12,
    "flags": 48,
    "projects": 3,
    "articles": 7,
    "htbGlobal": 12345,
    "htbSeason": 456
  }

  Research endpoint can return:

  [
    {
      "source": "HTB",
      "date": "2026",
      "title": "Example write-up",
      "summary": "Short description",
      "url": "https://..."
    }
  ]

  ============================================================
*/


window.PORTFOLIO_API =
  window.PORTFOLIO_API ||
  '/api/portfolio';


const siteData = {

  stats: {

    ctfs: 0,

    flags: 0,

    projects: 3,

    articles: 0,

    htbGlobal: '—',

    htbSeason: '—'

  },


  pinnedWriteups: [],


  localResearch: [],


  mediumFeeds: [

    'https://medium.com/feed/@crimsontyphoon'

  ]

};


/* ============================================================
   MAIN
============================================================ */

(() => {

  const reducedMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;


  /* ==========================================================
     MOBILE NAVIGATION
  ========================================================== */

  const menuToggle =
    document.querySelector('.menu-toggle');

  const siteNav =
    document.querySelector('.site-nav');


  menuToggle?.addEventListener('click', () => {

    const open =
      siteNav.classList.toggle('is-open');

    menuToggle.setAttribute(
      'aria-expanded',
      String(open)
    );

  });


  siteNav
    ?.querySelectorAll('a')
    .forEach((link) => {

      link.addEventListener('click', () => {

        siteNav.classList.remove('is-open');

        menuToggle?.setAttribute(
          'aria-expanded',
          'false'
        );

      });

    });


  /* ==========================================================
     SCROLL REVEALS
  ========================================================== */

  const revealItems =
    [...document.querySelectorAll('.reveal')];


  if (
    'IntersectionObserver' in window &&
    !reducedMotion
  ) {

    const revealObserver =
      new IntersectionObserver(

        (entries, observer) => {

          entries.forEach((entry) => {

            if (entry.isIntersecting) {

              entry.target.classList.add(
                'is-visible'
              );

              observer.unobserve(
                entry.target
              );

            }

          });

        },

        {
          threshold: 0.12
        }

      );


    revealItems.forEach((item) => {

      revealObserver.observe(item);

    });

  } else {

    revealItems.forEach((item) => {

      item.classList.add('is-visible');

    });

  }


  /* ==========================================================
     REFERENCE-STYLE CHECKER GRID
  ========================================================== */

  const gridSections =
    [...document.querySelectorAll(
      '[data-grid-section]'
    )];


  if ('IntersectionObserver' in window) {

    const gridObserver =
      new IntersectionObserver(

        (entries) => {

          const visible =
            entries.some(
              (entry) => entry.isIntersecting
            );

          document.body.classList.toggle(
            'grid-active',
            visible
          );

        },

        {
          threshold: 0.25
        }

      );


    gridSections.forEach((section) => {

      gridObserver.observe(section);

    });

  }


  /* ==========================================================
     LIVE COUNTERS
  ========================================================== */

  const counterNodes =
    [...document.querySelectorAll('[data-count]')];


  const formatNumber = (value) => {

    if (
      typeof value === 'string' &&
      value === '—'
    ) {

      return '—';

    }


    const number = Number(value);


    return Number.isFinite(number)
      ? number.toLocaleString('en-IN')
      : '—';

  };


  // Track active animations to prevent stale frames
  // from overwriting newer API values.
  const counterAnimations = new WeakMap();


  const animateCounter = (
    element,
    target,
    duration = 1300
  ) => {

    // Cancel the previous animation for this element.
    const previousFrame =
      counterAnimations.get(element);

    if (previousFrame !== undefined) {

      cancelAnimationFrame(previousFrame);

      counterAnimations.delete(element);

    }


    // Optional suffix, for example data-suffix="+"
    const suffix =
      element.dataset.suffix || '';


    // Handle unavailable or non-numeric values.
    if (
      typeof target === 'string' ||
      !Number.isFinite(Number(target))
    ) {

      element.textContent =
        (target ?? '—') + suffix;

      return;

    }


    const end = Number(target);


    if (reducedMotion) {

      element.textContent =
        formatNumber(end) + suffix;

      return;

    }


    const start = performance.now();

    const from = 0;


    const tick = (now) => {

      const progress =
        Math.min(
          (now - start) / duration,
          1
        );


      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        );


      element.textContent =
        formatNumber(
          Math.round(
            from +
            (end - from) * eased
          )
        ) + suffix;


      if (progress < 1) {

        const frameId =
          requestAnimationFrame(tick);

        counterAnimations.set(
          element,
          frameId
        );

      } else {

        counterAnimations.delete(element);

      }

    };


    const frameId =
      requestAnimationFrame(tick);

    counterAnimations.set(
      element,
      frameId
    );

  };


  let statsAnimated = false;


  const statsSection =
    document.querySelector('#practice');


  const runStatsAnimation = () => {

    if (statsAnimated) {
      return;
    }


    statsAnimated = true;


    counterNodes.forEach((node) => {

      animateCounter(
        node,
        siteData.stats[node.dataset.count]
      );

    });

  };


  if (
    statsSection &&
    'IntersectionObserver' in window
  ) {

    const statsObserver =
      new IntersectionObserver(

        ([entry]) => {

          if (entry.isIntersecting) {

            runStatsAnimation();

            statsObserver.disconnect();

          }

        },

        {
          threshold: 0.25
        }

      );


    statsObserver.observe(statsSection);

  } else {

    runStatsAnimation();

  }


  const renderProofStrip = () => {

    document
      .querySelectorAll('.proof-item [data-count]')
      .forEach((node) => {

        const value =
          siteData.stats[node.dataset.count];

        node.textContent =
          formatNumber(value);

      });

  };


  renderProofStrip();


  /* ==========================================================
     SECURITY ORBIT
  ========================================================== */

  const orbit =
    document.querySelector('#security-orbit');


  const orbitNodes = [
    ...document.querySelectorAll('.orbit-node')
  ];


  const orbitLines = [
    ...document.querySelectorAll(
      '.orbit-connections line'
    )
  ];


  let orbitAngle = -Math.PI / 2;

  let orbitVisible = false;

  let orbitPaused = false;

  let orbitPinned = null;

  let orbitFrame = null;

  let lastFrame = performance.now();


  const orbitAngles = [

    -Math.PI / 2,

    -Math.PI / 6,

    Math.PI / 6,

    Math.PI / 2,

    5 * Math.PI / 6,

    7 * Math.PI / 6

  ];


  const clearOrbitActive = () => {

    orbitNodes.forEach((node) => {

      node.classList.remove('is-active');

    });


    orbitLines.forEach((line) => {

      line.classList.remove('active');

    });

  };


  const setOrbitActive = (
    node,
    active
  ) => {

    node.classList.toggle(
      'is-active',
      active
    );


    const domain = node.dataset.domain;


    orbitLines.forEach((line) => {

      line.classList.toggle(
        'active',
        active &&
        line.dataset.line === domain
      );

    });

  };


  const pauseOrbit = (node = null) => {

    orbitPaused = true;

    clearOrbitActive();


    if (node) {

      setOrbitActive(node, true);

    }

  };


  const resumeOrbit = () => {

    if (orbitPinned) {
      return;
    }


    orbitPaused = false;

    clearOrbitActive();

  };


  const updateOrbit = (time) => {

    if (!orbit) {
      return;
    }


    const rect =
      orbit.getBoundingClientRect();


    const width = rect.width;

    const height = rect.height;

    const cx = width / 2;

    const cy = height / 2;

    const mobile = width < 680;


    const radius =
      Math.min(
        width * (mobile ? .31 : .34),
        height * (mobile ? .34 : .38)
      );


    if (
      !reducedMotion &&
      orbitVisible &&
      !orbitPaused
    ) {

      const delta =
        Math.min(
          time - lastFrame,
          50
        );


      orbitAngle +=
        delta / 26000 * Math.PI * 2;

    }


    lastFrame = time;


    orbitNodes.forEach((node, index) => {

      const angle =
        orbitAngles[index] + orbitAngle;


      const x =
        cx + Math.cos(angle) * radius;


      const y =
        cy + Math.sin(angle) * radius;


      node.style.left = `${x}px`;

      node.style.top = `${y}px`;


      const line =
        orbitLines.find(
          (item) =>
            item.dataset.line === node.dataset.domain
        );


      if (line) {

        line.setAttribute('x1', cx);

        line.setAttribute('y1', cy);

        line.setAttribute('x2', x);

        line.setAttribute('y2', y);

      }

    });


    if (
      !reducedMotion &&
      orbitVisible
    ) {

      orbitFrame =
        requestAnimationFrame(updateOrbit);

    } else {

      orbitFrame = null;

    }

  };


  if (orbit) {

    const orbitObserver =
      new IntersectionObserver(

        ([entry]) => {

          orbitVisible = entry.isIntersecting;


          if (
            orbitVisible &&
            !reducedMotion &&
            !orbitFrame
          ) {

            lastFrame = performance.now();

            orbitFrame =
              requestAnimationFrame(updateOrbit);

          }


          if (
            !orbitVisible &&
            orbitFrame
          ) {

            cancelAnimationFrame(orbitFrame);

            orbitFrame = null;

          }

        },

        {
          threshold: 0.08
        }

      );


    orbitObserver.observe(orbit);


    orbitNodes.forEach((node) => {

      node.addEventListener(
        'pointerenter',
        () => pauseOrbit(node)
      );


      node.addEventListener(
        'pointerleave',
        () => {

          if (!orbitPinned) {
            resumeOrbit();
          }

        }
      );


      node.addEventListener(
        'focus',
        () => pauseOrbit(node)
      );


      node.addEventListener(
        'blur',
        () => {

          if (!orbitPinned) {
            resumeOrbit();
          }

        }
      );


      node.addEventListener(
        'click',
        () => {

          if (orbitPinned === node) {

            orbitPinned = null;

            resumeOrbit();

            return;

          }


          orbitPinned = node;

          pauseOrbit(node);

        }
      );


      node.addEventListener(
        'keydown',
        (event) => {

          if (event.key === 'Escape') {

            orbitPinned = null;

            resumeOrbit();

            node.blur();

          }

        }
      );

    });


    updateOrbit(performance.now());

  }


  /* ==========================================================
     EXPERIENCE TABS
  ========================================================== */

  const experienceTabs = [
    ...document.querySelectorAll('.experience-tab')
  ];


  const experiencePanels = [
    ...document.querySelectorAll('.experience-entry')
  ];


  const activateExperience = (id) => {

    experienceTabs.forEach((tab) => {

      const active =
        tab.dataset.exp === id;


      tab.classList.toggle(
        'is-active',
        active
      );


      tab.setAttribute(
        'aria-selected',
        String(active)
      );

    });


    experiencePanels.forEach((panel) => {

      panel.classList.toggle(
        'is-active',
        panel.dataset.expPanel === id
      );

    });

  };


  experienceTabs.forEach((tab) => {

    tab.addEventListener(
      'click',
      () => {

        activateExperience(
          tab.dataset.exp
        );

      }
    );

  });


  /* ==========================================================
     RESEARCH
  ========================================================== */

  const writeupList =
    document.querySelector('#writeup-list');


  const escapeHtml = (value = '') =>
    String(value)

      .replaceAll('&', '&amp;')

      .replaceAll('<', '&lt;')

      .replaceAll('>', '&gt;')

      .replaceAll('"', '&quot;')

      .replaceAll("'", '&#039;');


  const formatResearchDate = (value) => {

    if (!value) {
      return '';
    }


    const timestamp = Date.parse(value);


    return Number.isFinite(timestamp)
      ? String(new Date(timestamp).getFullYear())
      : String(value);

  };


  const renderResearch = (items) => {

    if (!writeupList) {
      return;
    }


    if (!items.length) {

      writeupList.innerHTML = `

        <div class="research-empty">

          <strong>
            No public write-ups pinned yet.
          </strong>

          <br>

          Publish on Medium or add a Markdown file
          to the <code>research/</code> folder.
          Local write-ups are indexed automatically
          during the site build.

        </div>

      `;

      return;

    }


    writeupList.innerHTML =
      items
        .slice(0, 3)
        .map(
          (item, index) => `

            <a
              class="writeup-card"
              href="${escapeHtml(item.url)}"
              target="_blank"
              rel="noreferrer"
            >

              <span class="writeup-number">
                0${index + 1}
              </span>

              <div>

                <h3>
                  ${escapeHtml(item.title)}
                </h3>

                <p>
                  ${escapeHtml(
                    item.summary ||
                    'Security write-up / research note.'
                  )}
                </p>

                <div class="writeup-meta">

                  ${escapeHtml(
                    item.source || 'Research'
                  )}

                  ·

                  ${escapeHtml(
                    formatResearchDate(item.date)
                  )}

                </div>

              </div>

              <span class="text-link">
                Read ↗
              </span>

            </a>

          `
        )
        .join('');

  };


  /* ==========================================================
     GENERIC JSON FETCH
  ========================================================== */

  const fetchJson = async (
    url,
    options = {}
  ) => {

    try {

      const response =
        await fetch(
          url,
          {
            ...options,

            headers: {
              Accept: 'application/json',

              ...(options.headers || {})
            }

          }
        );


      if (!response.ok) {

        throw new Error(
          `HTTP ${response.status}`
        );

      }


      return await response.json();

    } catch {

      return null;

    }

  };


  /* ==========================================================
     STATS API
  ========================================================== */

  const normalizeStats = (data) => {

    if (
      !data ||
      typeof data !== 'object'
    ) {

      return;

    }


    Object.keys(siteData.stats).forEach((key) => {

      if (
        data[key] !== undefined &&
        data[key] !== null
      ) {

        siteData.stats[key] = data[key];

      }

    });


    renderProofStrip();


    // If the Practice section has already animated,
    // update its counters with the latest API values.
    // animateCounter cancels any older animation first.
    if (statsAnimated) {

      counterNodes.forEach((node) => {

        animateCounter(
          node,
          siteData.stats[node.dataset.count],
          700
        );

      });

    }

  };


  const loadStats = async () => {

    const data =
      await fetchJson(
        `${window.PORTFOLIO_API}/stats`
      );


    normalizeStats(data);

  };


  /* ==========================================================
     MEDIUM RSS
  ========================================================== */

  const fetchMediumFeed = async (feedUrl) => {

    const proxy =
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;


    const data = await fetchJson(proxy);


    if (!data?.items) {
      return [];
    }


    return data.items.map((item) => ({

      source: 'Medium',

      date: item.pubDate
        ? new Date(item.pubDate).toISOString()
        : '',

      title: item.title,

      summary: String(item.description || '')
        .replace(/<[^>]*>/g, '')
        .slice(0, 160),

      url: item.link

    }));

  };


  /* ==========================================================
     RESEARCH API + LOCAL MARKDOWN INDEX
  ========================================================== */

  const loadLocalResearch = async () => {

    try {

      const response =
        await fetch(
          '/research-index.json',
          { cache: 'no-cache' }
        );


      if (!response.ok) {

        throw new Error(
          `HTTP ${response.status}`
        );

      }


      const data = await response.json();


      return Array.isArray(data) ? data : [];

    } catch (error) {

      console.error(
        'Local research loading failed:',
        error
      );

      return [];

    }

  };


  const getResearchTimestamp = (item) => {

    if (!item?.date) {
      return 0;
    }


    const timestamp = Date.parse(item.date);


    return Number.isFinite(timestamp)
      ? timestamp
      : 0;

  };


  const loadResearch = async () => {

    const [
      apiData,
      localItems,
      mediumResults
    ] = await Promise.all([

      fetchJson(
        `${window.PORTFOLIO_API}/research`
      ),

      loadLocalResearch(),

      Promise.all(
        siteData.mediumFeeds
          .filter(Boolean)
          .map(fetchMediumFeed)
      )

    ]);


    const apiItems =
      Array.isArray(apiData)
        ? apiData
        : Array.isArray(apiData?.items)
          ? apiData.items
          : [];


    const mediumItems = mediumResults.flat();


    // Combine pinned, manually configured, API, local and Medium articles.
    const merged = [

      ...siteData.pinnedWriteups,

      ...siteData.localResearch,

      ...apiItems,

      ...localItems,

      ...mediumItems

    ];


    // Remove duplicate articles using their URL.
    const unique = merged.filter(
      (item, index, list) =>

        item?.url &&

        list.findIndex(
          other => other?.url === item.url
        ) === index
    );


    // Sort all sources from newest to oldest.
    unique.sort(
      (a, b) =>
        getResearchTimestamp(b) -
        getResearchTimestamp(a)
    );


    // Display only the three most recently published articles.
    renderResearch(
      unique.slice(0, 3)
    );

  };


  // Render existing pinned articles while remote feeds load.
  renderResearch(
    siteData.pinnedWriteups
  );


  loadStats();

  loadResearch();


  /* ==========================================================
     CONTACT FORM
  ========================================================== */

  const form =
    document.querySelector('#contact-form');


  const formStatus =
    document.querySelector('#form-status');


  form?.addEventListener(
    'submit',
    (event) => {

      event.preventDefault();


      const data = new FormData(form);


      const subject =
        encodeURIComponent(
          `[Portfolio] ${
            data.get('intent')
          } — ${
            data.get('name')
          }`
        );


      const body =
        encodeURIComponent(
          `Hi Soumyashree,

Reason: ${
            data.get('intent')
          }

${
            data.get('message')
          }

My email: ${
            data.get('email')
          }`
        );


      window.location.href =
        `mailto:soumyashree.sahoo.147@gmail.com?subject=${subject}&body=${body}`;


      if (formStatus) {

        formStatus.textContent =
          'Your email client is ready with the message drafted.';

      }

    }
  );


  /* ==========================================================
     YEAR
  ========================================================== */

  const year =
    document.querySelector('#year');


  if (year) {

    year.textContent =
      new Date().getFullYear();

  }

})();
