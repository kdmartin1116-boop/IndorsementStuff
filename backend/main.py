from fastapi import FastAPI
from backend.routes import nationality, discharge, annotator, packet

app = FastAPI()

app.include_router(nationality.router)
app.include_router(discharge.router)
app.include_router(annotator.router)
app.include_router(packet.router)
