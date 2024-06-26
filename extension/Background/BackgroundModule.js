// Import is not yet allowed in firefox, so for now I put tint_image in manifest.json

import { browser } from "../Vendor/Browser.js";

let browser_info_promise = browser.runtime.getBrowserInfo
  ? browser.runtime.getBrowserInfo()
  : Promise.resolve({ name: "Chrome" });
let is_firefox = browser_info_promise.then(
  (browser_info) => browser_info.name === "Firefox",
);

/**
 * @param {import("webextension-polyfill-ts").Windows.Window} window
 */
let is_valid_window = (window) => {
  return (
    window.incognito === false &&
    window.type === "normal" &&
    window.state !== "minimized"
  );
};

/**
 * Firefox can't take the `focused` property to browser.windows.create/update
 * So I just take it out when using firefox 🤷‍♀️
 * @param {import("webextension-polyfill-ts").Windows.CreateCreateDataType} window_properties
 * @returns {Promise<import("webextension-polyfill-ts").Windows.CreateCreateDataType>}
 */
let firefix_window = async (window_properties) => {
  let is_it_firefox = await is_firefox;
  if (is_it_firefox) {
    let { focused, ...good_properties } = window_properties;
    return good_properties;
  } else {
    return window_properties;
  }
};

// Get a window to put our tab on: either the last focussed, a random, or none;
// In case of none being found, null is returned and the caller should make a new window himself (with the tab attached)
/**
 * @param {number} windowId
 * @returns {Promise<import("webextension-polyfill-ts").Windows.Window>}
 */
const get_fallback_window = async (windowId) => {
  const first_fallback_window = await browser.windows.getLastFocused({
    // @ts-ignore
    windowTypes: ["normal"],
  });

  if (
    first_fallback_window.id !== windowId &&
    is_valid_window(first_fallback_window)
  ) {
    return first_fallback_window;
  } else {
    const windows = await browser.windows.getAll({ windowTypes: ["normal"] });
    const right_window = windows
      .filter((x) => is_valid_window(x))
      .filter((x) => x.id !== windowId)
      .sort((a, b) => a.tabs.length - b.tabs.length)[0];

    if (right_window) {
      return right_window;
    } else {
      return null;
    }
  }
};

// TODO Instead of using this static height, I can maybe "ping" the page I'm popup-izing
// after it is done becoming a popup: then it can figure out it's position itself
// (and check the size of it's current header itself)
const Chrome_Popup_Menubar_Height = window.outerHeight - window.innerHeight;

/**
 * @typedef WindowedMode
 * @type {"fullscreen" | "windowed" | "in-window" | "fullscreen" | "ask"}
 */

/**
 * @param {string} mode
 * @param {boolean} disabled
 * @returns {WindowedMode}
 */
let clean_mode = (mode, disabled) => {
  // Any other mode than the known ones are ignored
  if (mode == "fullscreen" || mode == "windowed" || mode == "in-window") {
    return mode;
  }
  return disabled === true ? "fullscreen" : "ask";
};
/** @param {import("webextension-polyfill-ts").Tabs.Tab} tab */
let get_host_config = async (tab) => {
  let host = new URL(tab.url).host;
  let host_mode = `mode(${host})`;
  let host_pip = `pip(${host})`;
  let {
    [host_mode]: mode,
    [host]: disabled,
    [host_pip]: pip,
  } = await browser.storage.sync.get([host_mode, host, host_pip]);

  return {
    mode: clean_mode(mode, disabled),
    pip: pip === true,
  };
};

/**
 * Wrapper to do some basic routing on extension messaging
 * @param {string} type
 * @param {(message: any, sender: import("webextension-polyfill-ts").Runtime.MessageSender) => Promise<any>} fn
 * @return {void}
 */
let onMessage = (type, fn) => {
  browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.type === type) {
      return fn(message, sender)
        .then((result) => {
          return { type: "resolve", value: result };
        })
        .catch((err) => {
          return {
            type: "reject",
            value: { message: err.message, stack: err.stack },
          };
        });
    }
  });
};

onMessage("update_windowed_button", async (message, sender) => {
  let tabs = message.id
    ? [await browser.tabs.get(message.id)]
    : await browser.tabs.query(message.query);
  for (let tab of tabs) {
    await update_button_on_tab(tab);
  }
});

onMessage("get_windowed_config", async (message, sender) => {
  return await get_host_config(sender.tab);
});

/** Detatch the current tab and put it into a standalone popup window */
onMessage("please_make_me_a_popup", async (message, sender) => {
  // TODO Save windowId and index inside that window,
  // so when you "pop" it back, it will go where you opened it
  let {
    left: screenLeft,
    top: screenTop,
    type: windowType,
  } = await browser.windows.get(sender.tab.windowId);

  // TODO Check possible 'panel' support in firefox
  let frame = message.position;
  if (windowType === "popup") {
    // Already a popup, no need to re-create the window
    await browser.windows.update(
      sender.tab.windowId,
      await firefix_window({
        focused: true,
        left: Math.round(screenLeft + frame.left),
        top: Math.round(screenTop + frame.top - Chrome_Popup_Menubar_Height),
        width: Math.round(frame.width),
        height: Math.round(frame.height + Chrome_Popup_Menubar_Height),
      }),
    );
    return;
  }

  const created_window = await browser.windows.create(
    await firefix_window({
      tabId: sender.tab.id,
      type: "popup",
      focused: true,
      left: Math.round(screenLeft + frame.left),
      top: Math.round(screenTop + frame.top - Chrome_Popup_Menubar_Height),
      width: Math.round(frame.width),
      height: Math.round(frame.height + Chrome_Popup_Menubar_Height),
    }),
  );

  return;
});

/**
 * Take the current tab, and put it into a tab-ed window again.
 * 1. Last focussed window
 * 2. Other tab-containing window (not popups without tab bar)
 * 3. New window we create
 */
onMessage("please_make_me_a_tab_again", async (message, sender) => {
  let { type: windowType } = await browser.windows.get(sender.tab.windowId);
  if (windowType === "normal") {
    return;
  }

  let fallback_window = await get_fallback_window(sender.tab.windowId);

  if (fallback_window) {
    await browser.tabs.move(sender.tab.id, {
      windowId: fallback_window.id,
      index: -1,
    });
    await browser.tabs.update(sender.tab.id, { active: true });
  } else {
    // No other window open: create a new window with tabs
    let create_window_with_tabs = await browser.windows.create({
      tabId: sender.tab.id,
      type: "normal",
    });
  }
});

/** @type {{ [tabid: number]: Promise<boolean> }} */
let current_port_promises = {};
/**
 * Check if we can connect with the Windowed content script in a tab
 * @param {number} tabId
 * @returns {Promise<boolean>}
 */
let ping_content_script = async (tabId) => {
  try {
    if (current_port_promises[tabId] != null) {
      return await current_port_promises[tabId];
    } else {
      current_port_promises[tabId] = new Promise((resolve, reject) => {
        let port = browser.tabs.connect(tabId);
        port.onMessage.addListener((message) => {
          resolve(true);
          port.disconnect();
        });
        port.onDisconnect.addListener((p) => {
          resolve(false);
        });
      });
      return await current_port_promises[tabId];
    }
  } finally {
    delete current_port_promises[tabId];
  }
};
