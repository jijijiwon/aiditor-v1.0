# -*- coding: utf-8 -*-
import os
import time
import asyncio
import requests
from dotenv import load_dotenv
import boto3
from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# 환경 변수 설정
ID = os.getenv('ID_M')
SECRET = os.getenv('SECRET_M')
BUCKET_NAME = os.getenv('BUCKET_NAME_M')
MYREGION = os.getenv('REGION_M')
FROM_FOLDER = 'edit-video/'  

# S3 클라이언트 생성
s3 = boto3.client('s3', aws_access_key_id=ID, aws_secret_access_key=SECRET, region_name=MYREGION)

last_check_time = None
app = FastAPI()

global_filename = ''
filename_set_event = asyncio.Event()

class FileData(BaseModel):
    filename: str

@app.get("/health")
def read_root():
    print("connected...")
    return {"Hi": "World"}

@app.post("/complete")
async def complete(file_data: FileData):
    global global_filename, filename_set_event

    if not file_data.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    processed_filename = file_data.filename.replace('./uploads/', '')
    global_filename = processed_filename  # 파일 이름을 글로벌 변수에 저장
    print(global_filename)
    
    # 파일 이름이 설정되었음을 알림
    filename_set_event.set()
    
    return {"status": "okay"}  # okay 사인 반환

@app.get("/get-url")
async def get_url(newVideoName: str = Query(..., description="The target filename to check against the global filename")):
    global global_filename, filename_set_event

    # 파일 이름이 설정될 때까지 대기
    if not global_filename:
        await filename_set_event.wait()
    
    # 글로벌 파일 이름과 파라미터로 받은 파일 이름이 일치하는지 확인
    if global_filename == newVideoName:
        # S3 파일의 서명된 URL 생성
        file_key = f"{FROM_FOLDER}{global_filename}"
        params = {
            'Bucket': BUCKET_NAME,
            'Key': file_key,
            'ResponseContentDisposition': 'attachment'
        }
        url = s3.generate_presigned_url('get_object', Params=params, ExpiresIn=3600)  # URL 1시간 유효

        # 글로벌 파일 이름 및 이벤트 초기화
        global_filename = ''
        filename_set_event.clear()

        return {"url": url}
    else:
        raise HTTPException(status_code=404, detail="Filename does not match or not set")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)