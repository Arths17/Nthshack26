import importlib
from typing import Any, Optional, Dict, Tuple
import os

# yfinance missing type stubs — silence the type checker for this import
import yfinance as yf  # type: ignore

# Dynamically import Generative AI SDK to avoid static import errors in editors
genai: Any = None
genai_pkg: Optional[str] = None
try:
    genai = importlib.import_module("google.generativeai")
    genai_pkg = "google.generativeai"
except Exception:
    try:
        genai = importlib.import_module("generativeai")
        genai_pkg = "generativeai"
    except Exception:
        genai = None
        genai_pkg = None

# Load .env into environment if available
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass

# Configure Gemini API
gemini_api_key = os.getenv("GEMINI_API_KEY", "")
if not gemini_api_key:
    # Try to read .env manually as a fallback (avoids dependency issues)
    env_path = os.path.join(os.getcwd(), ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
            gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        except Exception:
            pass

    if not gemini_api_key:
        print("⚠️  GEMINI_API_KEY not set!")
        print("   Get your key at: https://ai.google.dev/")
        print("   Then run: export GEMINI_API_KEY='your-key-here'")
        exit(1)

if genai is None:
    print("⚠️  Generative AI SDK not installed. Install 'google-generative-ai' or 'generativeai'.")
    exit(1)

print(f"Using generative AI SDK: {genai_pkg}")
# Configure SDK (typed as Any to avoid editor diagnostics)
try:
    genai.configure(api_key=gemini_api_key)  # type: ignore
except Exception:
    pass

def fetch_stock_data(ticker: str, start_date: str, end_date: str) -> Dict[str, Any]:
    """Fetch stock data from yfinance"""
    data = yf.download(ticker, start=start_date, end=end_date)  # type: ignore
    stock = yf.Ticker(ticker)  # type: ignore
    hist = stock.history(period="5mo")  # type: ignore
    
    return {
        "data": data,
        "stock": stock,
        "history": hist,
        "info": getattr(stock, "info", {})  # type: ignore
    }

def analyze_with_gemini(stock_data: Dict[str, Any], ticker: str) -> Tuple[Optional[Any], str]:
    """Analyze stock data using Gemini 2.5 Flash Lite with conversation"""
    info = stock_data.get("info", {})
    initial_prompt = f"""You are a stock analyst. Here's {ticker} stock data:
Price: ${info.get('currentPrice', 'N/A')}
52W High: ${info.get('fiftyTwoWeekHigh', 'N/A')}
52W Low: ${info.get('fiftyTwoWeekLow', 'N/A')}
Market Cap: {info.get('marketCap', 'N/A')}
PE Ratio: {info.get('trailingPE', 'N/A')}

Provide a brief investment outlook in 2-3 sentences."""
    try:
        print(f"  → Initializing Gemini chat session...")
        model = genai.GenerativeModel("gemini-2.5-flash-lite")  # type: ignore
        chat = model.start_chat(history=[])  # type: ignore
        response = chat.send_message(initial_prompt)  # type: ignore
        return chat, str(getattr(response, "text", "")).strip()
    except Exception as e:
        return None, f"Error: {str(e)}"

def conversation_loop(chat: Optional[Any], ticker: str) -> None:
    if chat is None:
        return
    print("\n💬 Ask follow-up questions (type 'exit' to quit):\n")
    while True:
        try:
            user_input = input(f"You: ").strip()
            if user_input.lower() == 'exit':
                print("\n👋 Goodbye!\n")
                break
            if not user_input:
                continue
            print(f"\n🤖 Gemini is thinking...")
            response = chat.send_message(user_input)  # type: ignore
            print(f"\nGemini: {getattr(response, 'text', '')}\n")
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!\n")
            break
        except Exception as e:
            print(f"Error: {str(e)}\n")

def main() -> None:
    ticker = "GOOGL"
    print(f"\n{'='*60}")
    print(f"📊 Stock Analysis for {ticker}")
    print(f"{'='*60}\n")
    print("Fetching stock data...")
    stock_data: Dict[str, Any] = fetch_stock_data(ticker, start_date="2023-01-01", end_date="2023-12-31")
    print(f"\n💰 Current Price: ${stock_data.get('info', {}).get('currentPrice', 'N/A')}")
    print(f"📈 52 Week High: ${stock_data.get('info', {}).get('fiftyTwoWeekHigh', 'N/A')}")
    print(f"📉 52 Week Low: ${stock_data.get('info', {}).get('fiftyTwoWeekLow', 'N/A')}\n")
    print(f"🤖 Generating AI Analysis with Gemini 2.5 Flash Lite...")
    chat, analysis = analyze_with_gemini(stock_data, ticker)
    print("\n" + "="*60)
    print("📋 Initial Analysis:")
    print("="*60)
    print(analysis)
    print("="*60)
    conversation_loop(chat, ticker)

if __name__ == "__main__":
    main()
