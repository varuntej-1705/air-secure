# Air Quality Monitoring Application
# ===================================

A comprehensive Flask-based web application for real-time air quality 
and weather monitoring across Indian cities with AI-powered chatbot.

## Features

- 🌍 Real-time AQI data for major Indian cities
- 🌤️ Weather information and forecasts
- 🤖 AI-powered chatbot using Google Gemini
- 📊 Interactive dashboards and visualizations
- 🗺️ India map with city markers

## Requirements

- Python 3.9+
- pip package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd WebStackGen
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

Required environment variables:
- `WEATHER_API_KEY` - WeatherAPI.com API key
- `GEMINI_API_KEY` - Google Gemini API key

## Running the Application

### Development Mode

```bash
python run.py
```

Or on Windows:
```bash
run.bat
```

The server will start at `http://localhost:5000`

### Production Mode

```bash
gunicorn -w 4 -b 0.0.0.0:5000 main:app
```

## Project Structure

```
├── main.py           # Flask application entry point
├── routes.py         # API route handlers
├── models.py         # Data models and schemas
├── storage.py        # In-memory storage utilities
├── utils.py          # Utility functions
├── config.py         # Application configuration
├── requirements.txt  # Python dependencies
├── run.py            # Development launcher
├── run.bat           # Windows launcher
├── static/           # Static files (CSS, JS, images)
└── templates/        # HTML templates
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cities` | GET | Get AQI data for all cities |
| `/api/weather/<city>` | GET | Get weather for specific city |
| `/api/chat` | POST | AI chatbot interaction |
| `/health` | GET | Health check endpoint |

## Technologies

- **Backend**: Flask, Python
- **Frontend**: React, TailwindCSS
- **AI**: Google Gemini
- **APIs**: WeatherAPI.com

## License

MIT License
