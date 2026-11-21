# ==========================================
# STAGE: Microservice Chatbot AI (FastAPI + RAG + ChromaDB)
# ==========================================
FROM python:3.12-slim

WORKDIR /app

# Cài đặt các thư viện hệ thống cần thiết (build tool, C/C++ compiler cho sentence-transformers & curl cho healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt pip mới nhất và PyTorch bản CPU nhẹ (tiết kiệm 3GB+ dung lượng Docker image)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Cài đặt dependencies từ requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Copy toàn bộ mã nguồn AI và dữ liệu chính sách
COPY . .

# Tạo sẵn thư mục lưu trữ dữ liệu Vector ChromaDB
RUN mkdir -p chroma_db_data

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
