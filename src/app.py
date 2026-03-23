import io
from PIL import Image
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, File, UploadFile, Depends, Form, Query
from fastapi.responses import RedirectResponse
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from src.db import database
from src.schemas import User, Login, Context_history
from src.auth import hash, check_hash, get_current_user, create_access_token
from src.ai import get_context, modelResponse, judge_debate

app = FastAPI()

@app.post('/register')
async def register_user(user: User):
    try:
        collection = database["user"]

        exist = await collection.find_one({
            "$or": [
                {"email": user.email},
                {"name": user.name}
            ]
        })

        if exist:
            raise HTTPException(status_code=400, detail="User already exists!")

        password = hash(password=user.password)

        result = await collection.insert_one({
            "name": user.name,
            "email": user.email,
            "password": password,
            "created_at": datetime.now(tz=timezone.utc)
        })

        token = create_access_token(str(result.inserted_id))

        return RedirectResponse(url="/login", status_code=308)

    except HTTPException:
        raise

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post('/login')
async def login_user(login: Login):
    try:
        collection = database["user"]
        user = await collection.find_one({
            "email": login.email
        })

        if not user:
            return RedirectResponse(url="/register", status_code=308)

        if check_hash(login.password, user["password"]):
            token = create_access_token(str(user["_id"]))
        else:
            raise HTTPException(status_code=401, detail="Invalid Credentials")

        return {"access_token": token}

    except HTTPException:
        raise

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post('/start-debate')
async def start_debate(topic: str, current_user: str = Depends(get_current_user)):
    try:
        context_history_collection = database["context_history"]

        await context_history_collection.update_one(
            {"user_id": current_user},
            {
                "$set": {
                    "active_debate": topic,
                    "context": ""
                }
            },
            upsert=True
        )

        return {"message": "Debate started"}

    except HTTPException:
        raise

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get('/debate/system-response')
async def system_response(user_response: str, current_user: str = Depends(get_current_user)):
    try:
        response = await modelResponse(argument=user_response, user_id=current_user)

        context_history_collection = database["context_history"]
        user = await context_history_collection.find_one({"user_id": current_user})
        
        if user:
            current_context = user.get("context", "")
            updated_context = f"{current_context}\nUser: {user_response}\nSystem: {response}"
            
            await context_history_collection.update_one(
                {"user_id": current_user},
                {"$set": {"context": updated_context}}
            )

        return {
            "System-response": response
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/end-debate")
async def end_debate(current_user: str = Depends(get_current_user)):
    try:
        context_history_collection = database["context_history"]
        verdict = await judge_debate(current_user)

        await context_history_collection.delete_one({"user_id": current_user})

        return verdict

    except HTTPException:
        raise

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")