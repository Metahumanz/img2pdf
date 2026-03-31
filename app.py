import os
import tempfile
import time
import threading
from typing import List

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import img2pdf

app = FastAPI(title="Image to PDF Converter")

# Allow CORS for development if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directory exists
os.makedirs("static", exist_ok=True)
os.makedirs("static/css", exist_ok=True)
os.makedirs("static/js", exist_ok=True)

from fastapi import Response
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(content=b"", media_type="image/x-icon", status_code=204)

@app.post("/api/convert")
async def convert_images_to_pdf(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Check if files have valid extensions
    valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff')
    valid_files = []
    
    for f in files:
        if any(f.filename.lower().endswith(ext) for ext in valid_extensions):
            valid_files.append(f)
            
    if not valid_files:
        raise HTTPException(status_code=400, detail="No valid image files provided")

    # Create a temporary directory to store uploaded files
    temp_dir = tempfile.mkdtemp()
    image_paths = []
    
    try:
        for idx, file in enumerate(valid_files):
            # Save files with index to preserve order
            filename = f"{idx:04d}_{file.filename}"
            file_path = os.path.join(temp_dir, filename)
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            image_paths.append(file_path)

        output_pdf_path = os.path.join(temp_dir, "output.pdf")
        
        # Convert to PDF
        with open(output_pdf_path, 'wb') as f:
            f.write(img2pdf.convert(image_paths))

        # Return the generated PDF file
        # The temporary directory will be removed manually later or by OS
        # For a robust solution, consider background tasks to clean up, 
        # but returning FileResponse is fine here.
        return FileResponse(
            path=output_pdf_path, 
            filename="combined.pdf", 
            media_type="application/pdf",
            background=None # we shouldn't delete the directory while the file is being read by the response
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

# Heartbeat mechanism to auto-shutdown when browser is closed
last_heartbeat_time = time.time() + 10  # 10 seconds grace period

@app.post("/api/heartbeat")
async def heartbeat():
    global last_heartbeat_time
    last_heartbeat_time = time.time()
    return {"status": "ok"}

def check_heartbeat():
    global last_heartbeat_time
    while True:
        time.sleep(2)
        if time.time() - last_heartbeat_time > 5:
            print("No active browser connection for 5 seconds. Shutting down server...")
            os._exit(0)

threading.Thread(target=check_heartbeat, daemon=True).start()

# Mount static files (HTML, CSS, JS)
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
