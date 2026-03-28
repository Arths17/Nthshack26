
import { useEffect } from "react";

/**
 * Keyboard shortcuts for the trading terminal
 * @param {string} currentSym - Current stock symbol
 * @param {array} watchlist - List of watchlist items with symbols
 * @param {function} onSymbolChange - Callback to change symbol
 * @param {function} onSendChat - Callback to send chat message
 * @param {function} onInputFocus - Callback to focus chat input
 */
export function useKeyboardShortcuts(currentSym, watchlist, onSymbolChange, onSendChat, onInputFocus) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if typing in input
      const isTyping = document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT";
      
      // J key: next stock
      if (e.key === "j" && !isTyping) {
        e.preventDefault();
        if (watchlist?.length > 0) {
          const currentIdx = watchlist.findIndex(w => w.symbol === currentSym);
          const nextIdx = (currentIdx + 1) % watchlist.length;
          onSymbolChange(watchlist[nextIdx].symbol);
        }
      }
      
      // K key: previous stock
      if (e.key === "k" && !isTyping) {
        e.preventDefault();
        if (watchlist?.length > 0) {
          const currentIdx = watchlist.findIndex(w => w.symbol === currentSym);
          const prevIdx = currentIdx === 0 ? watchlist.length - 1 : currentIdx - 1;
          onSymbolChange(watchlist[prevIdx].symbol);
        }
      }
      
      // Space bar: focus chat input (unless in text area)
      if (e.code === "Space" && !isTyping) {
        e.preventDefault();
        onInputFocus();
      }
      
      // Shift+Enter in chat: send message
      if (e.key === "Enter" && e.shiftKey && isTyping) {
        e.preventDefault();
        onSendChat();
      }
      
      // ? key: show help
      if (e.key === "?" && !isTyping) {
        e.preventDefault();
        showKeyboardHelp();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSym, watchlist, onSymbolChange, onSendChat, onInputFocus]);
}

/**
 * Show keyboard shortcuts help modal
 */
function showKeyboardHelp() {
  const shortcuts = [
    { keys: "j", action: "Next stock in watchlist" },
    { keys: "k", action: "Previous stock in watchlist" },
    { keys: "Space", action: "Focus chat input" },
    { keys: "Shift+Enter", action: "Send chat message" },
    { keys: "?", action: "Show this help" },
  ];

  const helpHTML = `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 9999;" onclick="this.remove()">
      <div style="background: rgba(15,20,40,.95); border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 24px; max-width: 400px; backdrop-filter: blur(16px);" onclick="event.stopPropagation()">
        <h2 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">⌨️ Keyboard Shortcuts</h2>
        <div style="font-size: 12px; color: rgba(148,163,184,.8); line-height: 2;">
          ${shortcuts.map(s => `
            <div style="display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.05);">
              <code style="background: rgba(79,172,254,.1); padding: 2px 6px; border-radius: 4px; color: #4facfe; font-weight: 600;">${s.keys}</code>
              <span>${s.action}</span>
            </div>
          `).join("")}
        </div>
        <div style="margin-top: 16px; font-size: 11px; color: rgba(148,163,184,.5);">Click anywhere to close</div>
      </div>
    </div>
  `;
  
  const container = document.createElement("div");
  container.innerHTML = helpHTML;
  document.body.appendChild(container);
}
