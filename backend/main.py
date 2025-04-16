from fastapi import FastAPI
from routes.users import router as users_router
from routes.items import router as items_router
from routes.analytics import router as analytics_router
from routes.quiz import router as quiz_router
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(items_router, prefix="/api/items", tags=["items"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(quiz_router, prefix="/api/quiz", tags=["quiz"])

frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static")