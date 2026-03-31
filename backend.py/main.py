import yfinance as yf
import importlib
try:
    import google.generativeai as genai
    _GENAI_IMPORT = "google.generativeai"
except Exception:
    try:
        legacy_module_name = "generative" + "ai"
        genai = importlib.import_module(legacy_module_name)
        _GENAI_IMPORT = "generativeai"
    except Exception:
        genai = None
        _GENAI_IMPORT = None
import os
from datetime import datetime

# Load .env into environment if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
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
            GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
        except Exception:
            pass

    if not GEMINI_API_KEY:
        print("⚠️  GEMINI_API_KEY not set!")
        print("   Get your key at: https://ai.google.dev/")
        print("   Then run: export GEMINI_API_KEY='your-key-here'")
        exit(1)

if genai is None:
    print("⚠️  Generative AI SDK not installed. Install 'google-generative-ai' or 'generativeai'.")
    exit(1)

print(f"Using generative AI SDK: {_GENAI_IMPORT}")
genai.configure(api_key=GEMINI_API_KEY)

def fetch_stock_data(ticker: str, start_date: str, end_date: str):
    """Fetch stock data from yfinance"""
    data = yf.download(ticker, start=start_date, end=end_date)
    stock = yf.Ticker(ticker)
    hist = stock.history(period="5mo")
    
    return {
        "data": data,
        "stock": stock,
        "history": hist,
        "info": stock.info
    }

def analyze_with_gemini(stock_data: dict, ticker: str):
    """Analyze stock data using Gemini 2.5 Flash Lite with conversation"""
    
    # Prepare data summary for analysis
    info = stock_data["info"]
    
    # Initial analysis prompt
    initial_prompt = f"""You are a stock analyst. Here's {ticker} stock data:
Price: ${info.get('currentPrice', 'N/A')}
52W High: ${info.get('fiftyTwoWeekHigh', 'N/A')}
52W Low: ${info.get('fiftyTwoWeekLow', 'N/A')}
Market Cap: {info.get('marketCap', 'N/A')}
PE Ratio: {info.get('trailingPE', 'N/A')}

Provide a brief investment outlook in 2-3 sentences."""
    
    try:
        print(f"  → Initializing Gemini chat session...")
        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        
        # Start conversation with initial analysis
        chat = model.start_chat(history=[])
        response = chat.send_message(initial_prompt)
        
        return chat, response.text.strip()
    except Exception as e:
        return None, f"Error: {str(e)}"

def conversation_loop(chat, ticker: str):
    """Allow user to continue conversation about the stock"""
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
            response = chat.send_message(user_input)
            print(f"\nGemini: {response.text}\n")
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!\n")
            break
        except Exception as e:
            print(f"Error: {str(e)}\n")

def main():
    # Fetch stock data for Google
    ticker = "GOOGL"
    
    print(f"\n{'='*60}")
    print(f"📊 Stock Analysis for {ticker}")
    print(f"{'='*60}\n")
    
    print("Fetching stock data...")
    stock_data = fetch_stock_data(ticker, start_date="2023-01-01", end_date="2023-12-31")
    
    # Display basic info
    print(f"\n💰 Current Price: ${stock_data['info'].get('currentPrice', 'N/A')}")
    print(f"📈 52 Week High: ${stock_data['info'].get('fiftyTwoWeekHigh', 'N/A')}")
    print(f"📉 52 Week Low: ${stock_data['info'].get('fiftyTwoWeekLow', 'N/A')}\n")
    
    # Get initial Gemini analysis
    print(f"🤖 Generating AI Analysis with Gemini 2.5 Flash Lite...")
    chat, analysis = analyze_with_gemini(stock_data, ticker)
    
    print("\n" + "="*60)
    print("📋 Initial Analysis:")
    print("="*60)
    print(analysis)
    print("="*60)
    
    # Start conversation loop
    conversation_loop(chat, ticker)

if __name__ == "__main__":
    main()

