from fastapi import APIRouter

router = APIRouter()

@router.get("/api/hello")
async def hello():
    return {"message": "Hello from the restructured backend!"}