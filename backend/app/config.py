import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv(override=True)

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    hf_token: str = ""
    secret_key: str = "your-secret-key"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
