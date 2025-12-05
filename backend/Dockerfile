FROM python:3.11-slim

WORKDIR /app

# 安裝依賴
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製程式碼
COPY . .

EXPOSE 8000

# 啟動 FastAPI（可依你的 main 檔修改）
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]