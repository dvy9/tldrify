import asyncio
import json
import os
import urllib.parse
from io import BytesIO
from typing import Literal

import requests
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from markitdown import MarkItDown
from openai import OpenAI
from pydantic import BaseModel, Field, ValidationError

app = FastAPI()
client = OpenAI(
    api_key=os.environ.get("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
)
md_gemini_25 = MarkItDown(llm_client=client, llm_model="gemini-2.5-flash")
md_gemini_20 = MarkItDown(llm_client=client, llm_model="gemini-2.0-flash")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: tighten in prod
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)


ModelName = Literal["gemini-2.5-flash", "gemini-2.0-flash"]  # TODO: add "gpt-5-nano"
WritingStyle = Literal["concise", "formal", "technical", "creative", "scientific"]


class Settings(BaseModel):
    model: ModelName
    writingStyle: WritingStyle
    maxWords: int = Field(ge=100, le=500)


class Summarized(BaseModel):
    title: str
    summary: str


class SummarizeResponse(BaseModel):
    title: str
    answer: str


MAX_FILE_BYTES = 5 * 1024 * 1024  # 5 MiB


async def enforce_file_limit(upload: UploadFile | None) -> UploadFile | None:
    if upload is None:
        return None
    chunk = await upload.read(MAX_FILE_BYTES + 1)
    if len(chunk) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 5 MiB limit.")
    upload.file.seek(0)
    return upload


async def verify_turnstile(token: str, remote_ip: str | None) -> None:
    secret = os.environ.get("TURNSTILE_SECRET_KEY")
    if not secret:
        raise HTTPException(status_code=500, detail="Server misconfiguration: missing TURNSTILE_SECRET_KEY.")

    def _do_verify() -> dict:
        url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
        payload = {"secret": secret, "response": token}
        if remote_ip:
            payload["remoteip"] = remote_ip
        resp = requests.post(url, data=payload)
        resp.raise_for_status()
        return resp.json()

    try:
        result = await asyncio.to_thread(_do_verify)
    except Exception:
        raise HTTPException(status_code=502, detail="Failed to verify Turnstile token.")

    if not result.get("success", False):
        errors = result.get("error-codes") or []
        raise HTTPException(status_code=403, detail=f"Turnstile verification failed: {errors}")


def _is_valid_url(text: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(text)
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
    except Exception:
        return False


async def fetch_with_jina(url: str) -> str:
    api_key = os.environ.get("JINA_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Server misconfiguration: missing JINA_API_KEY.")

    def _do_fetch() -> str:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "X-Base": "final",
        }
        resp = requests.post("https://r.jina.ai/", headers=headers, json={"url": url})
        resp.raise_for_status()
        return resp.text

    try:
        text_body = await asyncio.to_thread(_do_fetch)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to fetch URL: {e}")

    return text_body


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize_endpoint(
    request: Request,
    message: str = Form(...),
    settings: str = Form(...),
    turnstileToken: str = Form(...),
    file: UploadFile | None = File(None),
):
    token = (turnstileToken or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Missing Turnstile token.")
    client_ip = request.client.host if request and request.client else None
    await verify_turnstile(token, client_ip)

    message = (message or "").strip()
    if not message and file is None:
        raise HTTPException(status_code=400, detail="Either `message` or `file` must be provided.")

    try:
        settings_payload = json.loads(settings)
        s = Settings(**settings_payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="`settings` must be valid JSON.")
    except ValidationError as ve:
        raise HTTPException(status_code=400, detail=ve.errors())

    if message and _is_valid_url(message):
        message = await fetch_with_jina(message)

    file = await enforce_file_limit(file)
    if file is not None:
        md = md_gemini_25 if s.model == "gemini-2.5-flash" else md_gemini_20
        message += "\n\n" + md.convert(BytesIO(await file.read())).markdown

    style_guidance = {
        "concise": (
            "Write crisp, compact sentences. Avoid fluff and redundancy. "
            "Prefer short paragraphs or tight bullet points."
        ),
        "formal": (
            "Use a professional, objective tone. Prefer third person and avoid contractions."
            #
        ),
        "technical": (
            "Be precise and domain-appropriate. Include key metrics, terminology, and constraints when present."
        ),
        "creative": (
            "Be engaging and narrative, but stay faithful to facts. Use light stylistic flair sparingly."
            #
        ),
        "scientific": (
            "Maintain an objective, evidence-focused tone. Emphasize methods, data, limitations, and causality."
        ),
    }[s.writingStyle]

    system_prompt = (
        "You are a helpful assistant that produces a titled summary. "
        f"Follow these requirements strictly: \n"
        f"- Style: {s.writingStyle}. {style_guidance}\n"
        f"- Word limit: Do not exceed {s.maxWords} words in the summary.\n"
        "- Provide a short, informative title capturing the main subject.\n"
        "- Focus on the central ideas and key takeaways; omit fluff.\n"
        "- Preserve important terminology, numbers, and names.\n"
        "- Use plain language; add bullet points only if they enhance clarity.\n"
        "- Do not add disclaimers or meta commentary.\n"
        "- Return content suitable for fields: title and summary."
    )

    user_xml = (
        f"<task>summarize</task>\n"
        f"<writing_style>{s.writingStyle}</writing_style>\n"
        f"<max_words>{s.maxWords}</max_words>\n"
        f"<source>\n{message}\n</source>"
    )

    summarized = (
        client.chat.completions.parse(
            model=s.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_xml},
            ],
            response_format=Summarized,
        )
        .choices[0]
        .message.parsed
    )

    if not summarized or not summarized.summary.strip() or not summarized.title.strip():
        raise HTTPException(status_code=422, detail="The model did not return a valid response.")

    return SummarizeResponse(title=summarized.title, answer=summarized.summary)
