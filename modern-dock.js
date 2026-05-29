(function () {
  "use strict";

  function getControlElement(control) {
    if (!control) return null;
    if (typeof control.getContainer === "function") return control.getContainer();
    return control instanceof HTMLElement ? control : null;
  }

  function updateToolsCount() {
    const dock = document.getElementById("modernToolsDock");
    const count = document.getElementById("modernToolsCount");
    if (!dock || !count) return;

    const total = dock.querySelectorAll(".modern-tool-button").length;
    count.textContent = total > 0 ? `${total} outil${total > 1 ? "s" : ""}` : "plugins";
  }


  function dockElement(el, label, desiredIndex) {
    const dock = document.getElementById("modernToolsDock");
    if (!dock || !el || !label) return false;

    const key = label.toLowerCase().trim();
    if (dock.querySelector(`.modern-tool-button[data-tool-label="${CSS.escape(key)}"]`)) {
      el.style.display = "none";
      return true;
    }

    el.dataset.modernDocked = "true";
    el.style.position = "static";
    el.style.margin = "0";
    el.style.float = "none";
    el.style.clear = "none";

    const row = document.createElement("div");
    row.className = "modern-tool-button";
    row.dataset.toolLabel = key;
    row.title = label;

    const icon = document.createElement("span");
    icon.className = "modern-tool-icon-slot";

    const text = document.createElement("span");
    text.className = "modern-tool-button-label";
    text.textContent = label;

    icon.appendChild(el);
    row.append(icon, text);

    row.addEventListener("click", function (event) {
      if (event.target.closest("button,a,input,[role='button'],.leaflet-control")) return;
      const clickable = el.querySelector("button,a,input,[role='button']");
      if (clickable) clickable.click();
    });

    const rows = Array.from(dock.querySelectorAll(":scope > .modern-tool-button"));
    if (Number.isInteger(desiredIndex) && rows[desiredIndex]) {
      dock.insertBefore(row, rows[desiredIndex]);
    } else {
      dock.appendChild(row);
    }

    updateToolsCount();
    return true;
  }

  window.modernDockExistingControl = function (label, options) {
    const opts = options || {};
    const terms = (opts.terms || [label]).map(t => String(t).toLowerCase());
    const controls = Array.from(document.querySelectorAll(".leaflet-control"));

    const control = controls.find(el => {
      if (el.dataset.modernDocked === "true") return false;
      if (el.closest("#modernToolsDock,#modernHeaderInfoDock,#modernHeaderHelpDock")) return false;

      const haystack = [
        el.getAttribute("title") || "",
        el.getAttribute("aria-label") || "",
        el.className || "",
        el.textContent || "",
        el.innerHTML || ""
      ].join(" ").toLowerCase();

      return terms.some(term => haystack.includes(term));
    });

    return dockElement(control, label, opts.position);
  };

  window.modernDockSpecificControl = function (control, label) {
    dockElement(getControlElement(control), label);
  };})();
