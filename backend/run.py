"""Local development entry point: ``python run.py`` from the backend folder."""

from __future__ import annotations

import os

from config import CONFIG_BY_NAME, Config

from app import create_app

app = create_app(CONFIG_BY_NAME.get(os.environ.get("FLASK_ENV", "development"), Config))

if __name__ == "__main__":
    app.run(
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", "5000")),
        debug=app.config["DEBUG"],
    )
