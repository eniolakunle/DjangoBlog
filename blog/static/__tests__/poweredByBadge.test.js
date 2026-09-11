/**
 * @jest-environment jsdom
 */

describe("Powered By badge (TDD)", () => {
  let renderPoweredByBadge;
  let removePoweredByBadge;
  let MODEL;
  let VECTOR_DB;

  beforeEach(() => {
    jest.resetModules();
    // require inside tests so this file can be added before implementation
    // and won't crash module resolution if named exports are missing.
    // The tests will fail until the implementation is provided (TDD).
    // eslint-disable-next-line global-require
    const funcs = require("../js/functions");
    renderPoweredByBadge = funcs.renderPoweredByBadge;
    removePoweredByBadge = funcs.removePoweredByBadge;
    MODEL = funcs.MODEL || funcs.MODE || undefined;
    VECTOR_DB = funcs.VECTOR_DB || funcs.vectorDB || undefined;

    // clean DOM
    document.body.innerHTML = "";
  });

  test("exports render and remove helpers", () => {
    expect(typeof renderPoweredByBadge).toBe("function");
    expect(typeof removePoweredByBadge).toBe("function");
  });

  test("renderPoweredByBadge returns an element with class powered-by-badge and removal works", () => {
    const dialog = document.createElement("div");
    dialog.className = "search-dialog";
    document.body.appendChild(dialog);

    const el = renderPoweredByBadge();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.classList.contains("powered-by-badge")).toBe(true);

    // append into dialog (implementation is expected to do this)
    dialog.appendChild(el);

    const found = dialog.querySelector(".powered-by-badge");
    expect(found).toBeTruthy();

    if (typeof MODEL !== "undefined") {
      expect(found.textContent).toContain(MODEL);
    }
    if (typeof VECTOR_DB !== "undefined") {
      expect(found.textContent).toContain(VECTOR_DB);
    }

    // now test removal
    removePoweredByBadge();
    expect(dialog.querySelector(".powered-by-badge")).toBeNull();
  });
});
