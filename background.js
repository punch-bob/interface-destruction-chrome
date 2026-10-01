const title = "Разрушить страницу / закрыть игру";
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.action.setBadgeText({ tabId: tab.id, text: "…" });
    await chrome.action.setTitle({ tabId: tab.id, title: "Загружаем игру…" });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    await chrome.action.setBadgeText({ tabId: tab.id, text: "" });
    await chrome.action.setTitle({ tabId: tab.id, title });
  } catch (error) {
    console.warn("Не удалось открыть игру на этой странице:", error);
    await chrome.action.setBadgeBackgroundColor({
      tabId: tab.id,
      color: "#a73636",
    });
    await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
    await chrome.action.setTitle({
      tabId: tab.id,
      title:
        "Эта страница недоступна расширениям. Откройте обычный сайт и нажмите ещё раз.",
    });
  }
});
