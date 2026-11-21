from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings) :
    DATABASE_URL : str = "mysql+aiomysql://root:RootPassword123@key_mysql:3306/vtv_key_sellers"
    GEMINI_API_KEY : str = ""

    PROJECT_NAME : str = "VTV key sellers"
    API_PREFIX : str = "/api/v1"

    DEBUG : bool = True

    RESET_CHROMA_DB : bool = False
    CHROMA_DB_PATH : str = "./chroma_db_data"
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
settings = Settings()